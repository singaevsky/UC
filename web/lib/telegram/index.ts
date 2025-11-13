// lib/telegram/index.ts

// Экспорт бота и основных функций
export { bot, startBot } from './bot'

// Экспорт типов
export type {
  TelegramUser,
  TelegramChat,
  TelegramMessage,
  TelegramPhoto,
  BotConfig
} from './types'

// Утилиты для работы с Telegram
export const TelegramUtils = {
  formatOrderMessage: (order: any) => { /* ... */ },
  isAdmin: (userId: string, adminIds: string[]): boolean => { /* ... */ },
  escapeText: (text: string): string => { /* ... */ }
}

export const TELEGRAM_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 4096,
  SUPPORTED_PHOTO_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  COMMAND_PREFIX: '/'
}
