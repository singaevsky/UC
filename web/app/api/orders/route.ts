import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, delivery_method, delivery_price, address, payment_method, comments, promo_code, bonus_used = 0 } = body;

    // Здесь лучше получать supabase из middleware
    const userToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    let user_id: string | null = null;

    if (userToken) {
      const { data: u } = await supabase.auth.getUser(userToken);
      user_id = u.user?.id ?? null;
    }

    // Пересчёт total на сервере
    let total = 0;
    for (const it of items as any[]) {
      total += (it.price ?? 0) * it.quantity;
    }
    total += delivery_price ?? 0;
    // Бонусов к зачислению — 5% от total
    const bonus_earned = Math.round(total * 0.05);

    const { data: order, error: e1 } = await supabase.from('orders').insert({
      user_id,
      total,
      bonus_used,
      bonus_earned,
      promo_code: promo_code ?? null,
      delivery_method,
      delivery_price: delivery_price ?? 0,
      address,
      payment_method,
      comments
    }).select('*').single();

    if (e1) throw e1;

    for (const it of items as any[]) {
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: it.product_id ?? null,
        name_snapshot: it.name_snapshot ?? 'Индивидуальный торт',
        price: it.price ?? 0,
        quantity: it.quantity,
        cake_design: it.product_id ? null : it.options
      });
    }

    // Очистить корзину после заказа
    if (user_id) {
      await supabase.from('cart_items').delete().eq('user_id', user_id);
    }

    return NextResponse.json(order);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
