import { Telegraf } from 'telegraf'
import { createClient } from '@/lib/supabase/server'

// нициализация бота
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '')

// Middleware для проверки админов
const adminOnly = (ctx: any, next: any) => {
  const adminIds = process.env.TELEGRAM_ADMIN_IDS?.split(',') || []
  if (adminIds.includes(ctx.from?.id?.toString())) {
    return next()
  }
  return ctx.reply('❌  вас нет прав доступа к этой команде')
}

// оманда /start
bot.start((ctx) => {
  ctx.reply('👋 обро пожаловать в UC Cake Constructor Bot!')
})

// оманда /help
bot.help((ctx) => {
  ctx.reply(`
🤖 UC Cake Constructor Bot

оступные команды:
/start - ачать работу
/help - Справка
/orders - осмотреть заказы
/cakes - аталог тортов
/status - Статус системы
  `)
})

// оманда /orders - только для админов
bot.command('orders', adminOnly, async (ctx) => {
  try {
    const supabase = createClient()
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        users:user_id(name, email),
        order_items(
          *,
          products(name, price)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching orders:', error)
      return ctx.reply('❌ шибка получения заказов')
    }

    if (!orders || orders.length === 0) {
      return ctx.reply('📋 аказы не найдены')
    }

    let message = '📋 оследние заказы:\n\n'
    
    orders.forEach((order: any) => {
      const userName = order.users?.name || 'еизвестный'
      const total = order.total_amount || 0
      const status = order.status || 'новый'
      
      message += `🆔 #${order.id}\n`
      message += `�� ${userName}\n`
      message += `💰 ${total} \n`
      message += `📊 ${status}\n`
      message += `📅 ${new Date(order.created_at).toLocaleDateString()}\n`
      message += '---\n'
    })

    ctx.reply(message)
  } catch (error) {
    console.error('Orders command error:', error)
    ctx.reply('❌ роизошла ошибка')
  }
})

// оманда /status - статус системы
bot.command('status', adminOnly, async (ctx) => {
  try {
    const supabase = createClient()
    
    // олучаем статистику
    const [ordersResult, productsResult] = await Promise.all([
      supabase.from('orders').select('id, status').order('created_at', { ascending: false }).limit(100),
      supabase.from('products').select('id, name').order('created_at', { ascending: false }).limit(50)
    ])

    const totalOrders = ordersResult.data?.length || 0
    const pendingOrders = ordersResult.data?.filter(o => o.status === 'pending').length || 0
    const totalProducts = productsResult.data?.length || 0

    ctx.reply(`
📊 Статус системы UC Cake

📦 аказы:
• сего: ${totalOrders}
•  ожидании: ${pendingOrders}

🧁 Товары:
• сего: ${totalProducts}

⏰ бновлено: ${new Date().toLocaleString()}
    `)
  } catch (error) {
    console.error('Status command error:', error)
    ctx.reply('❌ шибка получения статуса')
  }
})

// бработка фотографий для заказов
bot.on('photo', async (ctx) => {
  const photo = ctx.message.photo[ctx.message.photo.length - 1]
  const fileId = photo.file_id
  
  ctx.reply(`📸 олучено изображение (ID: ${fileId})`)
  
  // десь можно добавить логику сохранения изображений
})

// бработка ошибок
bot.catch((err, ctx) => {
  console.error('Bot error:', err)
  ctx.reply('❌ роизошла ошибка в боте')
})

// кспорт бота для использования в других файлах
export { bot }

// ункция для запуска бота (только если не в тестовом режиме)
export function startBot() {
  if (process.env.NODE_ENV === 'production') {
    bot.launch()
    console.log('🤖 Telegram bot запущен')
  } else {
    console.log('🤖 Telegram bot запущен в development режиме')
  }
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
