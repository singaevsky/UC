import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const update = await req.json();

    // Обрабатываем webhook от Telegram
    if (update.message) {
      const message = update.message;

      if (message.text === '/start') {
        // Пользователь начал диалог
        await fetch(
          `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: message.chat.id,
              text: '🤖 Привет! Я бот кондитерской. Отправьте номер заказа для отслеживания.'
            })
          }
        );
      }
    }

    return new Response('OK');

  } catch (error) {
    return new Response('Error', { status: 500 });
  }
});
