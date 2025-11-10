import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get('payment_id');

  if (!paymentId) {
    return NextResponse.json({ error: 'Не указан ID платежа' }, { status: 400 });
  }

  try {
    const shopId = process.env.YOO_SHOP_ID!;
    const secret = process.env.YOO_SECRET_KEY!;
    const auth = Buffer.from(`${shopId}:${secret}`).toString('base64');

    const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'Ошибка получения статуса платежа' }, { status: 400 });
    }

    // Если платеж успешен, обновляем заказ
    if (result.status === 'succeeded') {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, total, user_id, bonus_earned')
        .eq('payment_id', paymentId)
        .limit(1);

      if (orders?.[0]) {
        const order = orders[0];

        // Обновляем статус заказа
        await supabase
          .from('orders')
          .update({
            status: 'paid',
            payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

        // Начисляем бонусы
        if (order.user_id && order.bonus_earned > 0) {
          await supabase.rpc('increment_bonus', {
            p_user_id: order.user_id,
            p_amount: order.bonus_earned
          });
        }
      }
    }

    return NextResponse.json({
      id: result.id,
      status: result.status,
      amount: result.amount.value,
      created_at: result.created_at
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
