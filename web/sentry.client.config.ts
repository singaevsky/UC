// file: sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

// ✅ Типы для конфигурации
interface SentryConfig {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
  release?: string;
}

// ✅ Получаем конфигурацию из переменных окружения
const config: SentryConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.SENTRY_ENV || process.env.NODE_ENV,
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  replaysSessionSampleRate: parseFloat(process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0.1'),
  replaysOnErrorSampleRate: parseFloat(process.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || '1.0'),
  release: process.env.NEXT_PUBLIC_APP_VERSION,
};

// ✅ Проверка обязательных параметров
if (!config.dsn && process.env.NODE_ENV === 'production') {
  console.warn('Sentry DSN is not configured in production environment');
}

// ✅ Инициализация Sentry
Sentry.init({
  dsn: config.dsn,

  // ✅ Настройки производительности
  tracesSampleRate: config.tracesSampleRate,

  // ✅ Настройки Session Replay
  replaysSessionSampleRate: config.replaysSessionSampleRate,
  replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,

  // ✅ Интеграции
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    // ✅ Дополнительные интеграции
    Sentry.browserTracingIntegration({
      instrumentNavigation: true,
      instrumentPageLoad: true,
      routingInstrumentation: Sentry.nextRouterInstrumentation,
    }),
  ],

  // ✅ Окружение и релиз
  environment: config.environment,
  release: config.release,

  // ✅ Настройки сэмплирования и фильтрации
  beforeSend(event, hint) {
    // Фильтруем duplicate errors
    const error = hint.originalException;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = error.message;

      // Исключаем известные браузерные ошибки
      if (message.includes('ResizeObserver loop limit exceeded') ||
          message.includes('Script error') ||
          message.includes('Non-Error promise rejection captured')) {
        return null;
      }
    }

    return event;
  },

  // ✅ Дополнительные настройки
  debug: process.env.NODE_ENV === 'development',

  // ✅ Настройки采集 данных
  beforeSendTransaction(transaction) {
    // Фильтруем health check endpoints
    if (transaction.name?.includes('/api/health') ||
        transaction.name?.includes('/_next')) {
      return null;
    }
    return transaction;
  },

  // ✅ Максимальная длина breadcrumbs
  maxBreadcrumbs: 50,

  // ✅ Игнорируем определенные ошибки
  ignoreErrors: [
    /Non-Error promise rejection captured/,
    /Script error/,
    /ResizeObserver loop limit exceeded/,
  ],

  // ✅ Настройки для SPA
  autoSessionTracking: true,

  // ✅ Дополнительные теги
  initialScope: {
    tags: {
      component: 'client',
      version: config.release || 'unknown',
    },
  },
});

// ✅ Дополнительные функции для клиентского использования
export const sentryClient = {
  captureException: (error: Error, context?: Record<string, any>) => {
    Sentry.captureException(error, {
      extra: context,
      tags: {
        source: 'client',
        ...context?.tags,
      },
    });
  },

  captureMessage: (message: string, level: Sentry.SeverityLevel = 'info') => {
    Sentry.captureMessage(message, level);
  },

  addBreadcrumb: (breadcrumb: Sentry.Breadcrumb) => {
    Sentry.addBreadcrumb({
      ...breadcrumb,
      category: breadcrumb.category || 'custom',
      level: breadcrumb.level || 'info',
    });
  },

  setUser: (user: Sentry.User) => {
    Sentry.setUser(user);
  },

  setTag: (key: string, value: string) => {
    Sentry.setTag(key, value);
  },

  setExtra: (key: string, extra: any) => {
    Sentry.setExtra(key, extra);
  },
};

// ✅ Экспорт инициализированного Sentry
export default Sentry;
