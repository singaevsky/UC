import { Telegraf, Markup } from 'telegraf';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class ConditerTelegramBot {
  private bot: Telegraf;
  private chatId: string;

  constructor() {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
    this.chatId = process.env.TELEGRAM_CHAT_ID!;
    this.setupCommands();
    this.setupOrderHandlers();
  }

  private setupCommands() {
    this.bot.start((ctx) => {
      ctx.reply('🤖 Привет! Я бот кондитерской "Уездный кондитер"\n\nЯ помогу отследить ваш заказ!',
        Markup.keyboard([
          ['📦 Мои заказы', '🎂 Конструктор'],
          ['📞 Контакты', '❓ Помощь']
        ]).resize()
      );
    });

    this.bot.command('orders', async (ctx) => {
      await this.showUserOrders(ctx);
    });

    this.bot.command('help', (ctx) => {
      ctx.reply(`📋 Доступные команды:
/start - Начать
/orders - Мои заказы
/help - Помощь

Также вы можете:
• Написать номер заказа для отслеживания
• Спросить про доставку или оплату`);
    });

    this.bot.hears(/^#(\d+)$/, async (ctx) => {
      const orderId = parseInt(ctx.match[1]);
      await this.trackOrder(ctx, orderId);
    });
  }

  private setupOrderHandlers() {
    this.bot.hears('📦 Мои заказы', async (ctx) => {
      await this.showUserOrders(ctx);
    });

    this.bot.hears('🎂 Конструктор', (ctx) => {
      ctx.reply('🧁 Перейдите на наш сайт для создания торта:\nhttps://yoursite.ru/constructor');
    });

    this.bot.hears('📞 Контакты', (ctx) => {
      ctx.reply(`📍 Адрес: г. Уездный, ул. Кондитерская, 5
📱 Телефон: +7 (999) 000-00-00
✉️ Email: hello@konditer.ru
🕒 Режим работы: Ежедневно 09:00-21:00`);
    });

    this.bot.hears('❓ Помощь', (ctx) => {
      ctx.reply(`❓ Частые вопросы:

• Как оформить заказ? - Оформите на сайте или позвоните
• Сроки изготовления? - 1-3 дня, срочные - возможны
• Способы оплаты? - Картой онлайн, наличными
• Доставка? - Самовывоз, курьер, СДЭК
• Возврат? - Согласно законодательству РФ`);
    });
  }

  private async showUserOrders(ctx: any) {
    try {
      // В реальном проекте здесь был бы user_id по chatId
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, total, created_at, delivery_method, address')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!orders || orders.length === 0) {
        ctx.reply('📭 У вас пока нет заказов');
        return;
      }

      const message = orders.map(order => {
        const statusEmojis: Record<string, string> = {
          'created': '🆕',
          'paid': '💳',
          'preparing': '🧁',
          'ready': '✅',
          'delivered': '📦',
          'cancelled': '❌'
        };

        return `📦 Заказ #${order.id}
💰 Сумма: ${order.total} ₽
${statusEmojis[order.status] || '📋'} Статус: ${order.status}
🗓️ ${new Date(order.created_at).toLocaleDateString()}
🚚 ${order.delivery_method === 'pickup' ? '🏪 Самовывоз' : '🚚 Доставка'}`;
      }).join('\n\n');

      ctx.reply(message);
    } catch (error) {
      console.error('Error showing orders:', error);
      ctx.reply('❌ Ошибка получения заказов');
    }
  }

  private async trackOrder(ctx: any, orderId: number) {
    try {
      const { data: order } = await supabase
        .from('orders')
        .select(`
          id, status, total, created_at, delivery_method, address, payment_method
        `)
        .eq('id', orderId)
        .single();

      if (!order) {
        ctx.reply(`❌ Заказ #${orderId} не найден`);
        return;
      }

      const statusMessages: Record<string, string> = {
        'created': '🆕 Заказ создан, ожидаем оплату',
        'paid': '💳 Оплата получена, передали в работу',
        'preparing': '🧁 Торт готовится нашими кондитерами',
        'ready': '✅ Торт готов к выдаче/доставке',
        'delivered': '📦 Заказ доставлен! Приятного аппетита!',
        'cancelled': '❌ Заказ отменен'
      };

      const message = `📦 Заказ #${order.id}
💰 Сумма: ${order.total} ₽
${statusMessages[order.status] || '📋 Статус: ' + order.status}
🗓️ Создан: ${new Date(order.created_at).toLocaleString()}
💳 Оплата: ${order.payment_method}
🚚 Доставка: ${order.delivery_method === 'pickup' ? '🏪 Самовывоз' : '🚚 Курьер/СДЭК'}`;

      ctx.reply(message);

      if (order.status === 'delivered') {
        ctx.reply('😊 Нам важно ваше мнение! Оставьте отзыв на сайте ⭐');
      }

    } catch (error) {
      console.error('Error tracking order:', error);
      ctx.reply('❌ Ошибка отслеживания заказа');
    }
  }

  public async sendOrderNotification(orderData: any) {
    try {
      const orderItems = orderData.order_items || [];
      let itemsText = '';

      if (orderItems.length > 0) {
        itemsText = '\n\n📋 Позиции:\n' +
          orderItems.map((item: any) =>
            `• ${item.name_snapshot} - ${item.quantity} шт. = ${item.price * item.quantity} ₽`
          ).join('\n');
      }

      const message = `🎂 <b>Новый заказ #${orderData.id}</b>

👤 Клиент: ${orderData.client_name || 'Гость'}
📱 Телефон: ${orderData.phone || 'Не указан'}
💰 Сумма: ${orderData.total} ₽
🚚 Доставка: ${orderData.delivery_method}
💳 Оплата: ${orderData.payment_method}
🕒 Дата: ${new Date(orderData.created_at).toLocaleString()}

${orderData.comments ? `📝 Комментарий: ${orderData.comments}` : ''}${itemsText}`;

      await this.bot.telegram.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Принять', callback_data: `accept_${orderData.id}` },
              { text: '❌ Отменить', callback_data: `cancel_${orderData.id}` }
            ]
          ]
        }
      });

    } catch (error) {
      console.error('Error sending order notification:', error);
    }
  }

  public async sendStatusUpdate(orderId: number, status: string, total: number) {
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
    const message = `${emoji} <b>Обновление заказа #${orderId}</b>\nСтатус изменен: <b>${status}</b>\n💰 Сумма: ${total} ₽`;

    try {
      await this.bot.telegram.sendMessage(this.chatId, message, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('Error sending status update:', error);
    }
  }

  public launch() {
    this.bot.launch();
    console.log('🤖 Telegram bot launched');
  }
}

export const telegramBot = new ConditerTelegramBot();
