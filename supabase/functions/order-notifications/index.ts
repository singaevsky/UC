import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { orderId, status } = await req.json();

    // Получаем данные заказа
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles(full_name, phone),
        order_items(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    // Отправляем уведомление в Telegram (через HTTP request)
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: Deno.env.get('TELEGRAM_CHAT_ID'),
          text: `🎂 Заказ #${order.id} - статус: ${status}\nКлиент: ${order.profiles?.full_name || 'Гость'}\nСумма: ${order.total} ₽`
        })
      }
    );

    // Создаем уведомление в БД
    await supabase.from('notifications').insert({
      user_id: order.user_id,
      type: 'order_status',
      payload: { order_id: orderId, status, order_total: order.total }
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
