import fetch from 'node-fetch';

export class TelegramBot {
  private token: string;
  private chatId: string;

  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN!;
    this.chatId = process.env.TELEGRAM_CHAT_ID!;
  }

  async sendMessage(message: string, options?: {
    parseMode?: 'HTML' | 'Markdown';
    replyMarkup?: any;
  }) {
    const url = `https://api.telegram.org/bot${this.token}/sendMessage`;

    const payload = {
      chat_id: this.chatId,
      text: message,
      parse_mode: options?.parseMode || 'HTML',
      reply_markup: options?.replyMarkup
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      return await response.json();
    } catch (error) {
      console.error('Telegram API error:', error);
      return { ok: false, error };
    }
  }

  async sendOrderNotification(orderData: any) {
    const message = `
🎂 <b>Новый заказ #${orderData.id}</b>

👤 Клиент: ${orderData.client_name || 'Гость'}
📱 Телефон: ${orderData.phone || 'Не указан'}
💰 Сумма: ${orderData.total} ₽
🚚 Доставка: ${orderData.delivery_method}
💳 Оплата: ${orderData.payment_method}
🕒 Дата: ${new Date(orderData.created_at).toLocaleString()}

${orderData.comments ? `📝 Комментарий: ${orderData.comments}` : ''}
    `.trim();

    return this.sendMessage(message);
  }

  async sendStatusUpdate(orderId: number, status: string, total: number) {
    const statusEmojis: Record<string, string> = {
      'created': '🆕',
      'paid': '💳',
      'preparing': '🧁',
      'ready': '✅',
      'delivered': '📦',
      'cancelled': '❌',
      'refunded': '💸'
    };

    const emoji = statusEmojis[status] || '📋';
    const message = `${emoji} <b>Статус заказа #${orderId}</b> изменён на <b>${status}</b>\n💰 Сумма: ${total} ₽`;

    return this.sendMessage(message);
  }
}

export const telegramBot = new TelegramBot();
