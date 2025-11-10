import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: NextRequest) {
  const { order_id, amount, description } = await req.json();
  if (!order_id || !amount) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const shopId = process.env.YOO_SHOP_ID!;
  const secret = process.env.YOO_SECRET_KEY!;
  const auth = Buffer.from(`${shopId}:${secret}`).toString('base64');

  const body = {
    amount: { value: String(amount.toFixed(2)), currency: 'RUB' },
    confirmation: { type: 'redirect', return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account` },
    capture: true,
    description: description ?? `Оплата заказа #${order_id}`
  };

  const resp = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Idempotence-Key': String(order_id), 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await resp.json();
  if (!resp.ok) {
    return NextResponse.json({ error: data }, { status: 400 });
  }

  // Сохранить payment_id в заказ
  await supabase.from('orders').update({ payment_id: data.id, payment_status: 'pending' }).eq('id', order_id);

  return NextResponse.json(data);
}
