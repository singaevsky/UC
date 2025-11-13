import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

const supabase = getServerClient();

export async function POST(req: NextRequest) {
  try {
    const { order_id, amount, description } = await req.json();

    if (!order_id || !amount) {
      return NextResponse.json({ error: 'Необходим ID заказа и сумма' }, { status: 400 });
    }

    const shopId = process.env.YOO_SHOP_ID!;
    const secret = process.env.YOO_SECRET_KEY!;

    if (!shopId || !secret) {
      return NextResponse.json({ error: 'Не настроены параметры платежной системы' }, { status: 500 });
    }

    const auth = Buffer.from(`${shopId}:${secret}`).toString('base64');

    const paymentData = {
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB'
      },
      confirmation: {
        type: 'redirect',
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?payment=success`
      },
      capture: true,
      description: description || `Оплата заказа #${order_id}`,
      metadata: {
        order_id: order_id.toString()
      }
    };

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Idempotence-Key': `order-${order_id}-${Date.now()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('YooKassa API Error:', result);
      return NextResponse.json({
        error: 'Ошибка создания платежа',
        details: result
      }, { status: 400 });
    }

    // Обновляем заказ с ID платежа
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_id: result.id,
        payment_status: 'pending'
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('Database update error:', updateError);
    }

    return NextResponse.json({
      id: result.id,
      status: result.status,
      amount: result.amount.value,
      confirmation: result.confirmation,
      created_at: result.created_at
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({
      error: 'Внутренняя ошибка сервера'
    }, { status: 500 });
  }
}
