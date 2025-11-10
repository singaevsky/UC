import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { telegramBot } from '@/lib/telegram/bot';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const event = JSON.parse(bodyText);

    const type = event?.event;
    const payment = event?.object;
    const paymentId = payment?.id;
    const status = payment?.status;

    if (type === 'payment.succeeded') {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          profiles(full_name, phone),
          order_items(*)
        `)
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

        // Отправляем уведомление в Telegram
        try {
          await telegramBot.sendOrderNotification({
            id: order.id,
            client_name: order.profiles?.full_name,
            phone: order.profiles?.phone,
            total: order.total,
            delivery_method: order.delivery_method,
            payment_method: order.payment_method,
            created_at: order.created_at,
            comments: order.comments,
            order_items: order.order_items
          });
        } catch (error) {
          console.error('Telegram notification error:', error);
        }
      }
    }

    if (type === 'payment.canceled' || type === 'payment.refunded') {
      const status = type === 'payment.canceled' ? 'cancelled' : 'refunded';
      const { data: orders } = await supabase.from('orders')
        .select('id, total, status')
        .eq('payment_id', paymentId)
        .limit(1);

      if (orders?.[0]) {
        const order = orders[0];
        await supabase.from('orders')
          .update({ status, payment_status: status })
          .eq('id', order.id);

        try {
          await telegramBot.sendStatusUpdate(order.id, status, order.total);
        } catch (error) {
          console.error('Telegram status update error:', error);
        }
      }
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
