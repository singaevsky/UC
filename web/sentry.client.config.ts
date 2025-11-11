// file: sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

// ✅ Типы для серверной конфигурации
interface ServerSentryConfig {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: number;
  release?: string;
  profilesSampleRate?: number;
}

// ✅ Получаем конфигурацию из переменных окружения
const config: ServerSentryConfig = {
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENV || process.env.NODE_ENV,
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
};

// ✅ Проверка обязательных параметров для production
if (!config.dsn && process.env.NODE_ENV === 'production') {
  console.warn('Sentry DSN is not configured in production environment');
}

// ✅ Инициализация Sentry для сервера
Sentry.init({
  dsn: config.dsn,

  // ✅ Настройки производительности
  tracesSampleRate: config.tracesSampleRate,
  profilesSampleRate: config.profilesSampleRate,

  // ✅ Интеграции для сервера
  integrations: [
    // Автоматическая трассировка API routes
    Sentry.httpIntegration(),
    Sentry.modulesIntegration(),
    Sentry.onUnhandledRejectionIntegration(),
    Sentry.onuncaughtExceptionIntegration(),
  ],

  // ✅ Окружение и релиз
  environment: config.environment,
  release: config.release,

  // ✅ Настройки сэмплирования и фильтрации
  beforeSend(event, hint) {
    // Фильтруем системные ошибки Node.js
    const error = hint.originalException;
    if (error && typeof error === 'object') {
      const message = 'message' in error ? error.message : '';

      // Исключаем известные системные ошибки
      if (message.includes('ECONNREFUSED') ||
          message.includes('ETIMEDOUT') ||
          message.includes('Connection timeout') ||
          message.includes('Read timeout')) {
        return null;
      }
    }

    // Добавляем контекст сервера
    event.extra = {
      ...event.extra,
      server: true,
      node_version: process.version,
      platform: process.platform,
    };

    return event;
  },

  // ✅ Обработка транзакций
  beforeSendTransaction(transaction) {
    // Фильтруем внутренние Next.js маршруты
    if (transaction.name?.includes('/_next') ||
        transaction.name?.includes('/api/_health') ||
        transaction.name?.includes('/api/internal')) {
      return null;
    }

    // Добавляем теги для сервера
    transaction.tags = {
      ...transaction.tags,
      source: 'server',
      runtime: 'nodejs',
    };

    return transaction;
  },

  // ✅ Отладка в development
  debug: process.env.NODE_ENV === 'development',

  // ✅ Максимальная длина breadcrumbs
  maxBreadcrumbs: 100,

  // ✅ Игнорируем определенные ошибки
  ignoreErrors: [
    /Connection refused/,
    /ETIMEDOUT/,
    /ECONNREFUSED/,
    /Read timeout/,
    /Script error/,
  ],

  // ✅ Настройки для API
  autoSessionTracking: true,

  // ✅ Начальный scope с серверной информацией
  initialScope: {
    tags: {
      component: 'server',
      version: config.release || 'unknown',
      environment: config.environment || 'unknown',
    },
  },

  // ✅ Дополнительные настройки для SSR
  showReportDialog: false, // Отключаем диалог на сервере
});

// ✅ Дополнительные функции для серверного использования
export const sentryServer = {
  captureException: (error: Error, context?: Record<string, any>) => {
    Sentry.captureException(error, {
      extra: {
        ...context,
        server: true,
        timestamp: new Date().toISOString(),
      },
      tags: {
        source: 'server',
        component: context?.component,
        action: context?.action,
      },
      fingerprint: [
        '{{ default }}',
        context?.fingerprint,
      ].filter(Boolean),
    });
  },

  captureMessage: (message: string, level: Sentry.SeverityLevel = 'info') => {
    Sentry.captureMessage(message, level);
  },

  addBreadcrumb: (breadcrumb: Sentry.Breadcrumb) => {
    Sentry.addBreadcrumb({
      ...breadcrumb,
      category: breadcrumb.category || 'server',
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

  // ✅ Специальная функция для API routes
  captureApiError: (error: Error, request: any, context?: Record<string, any>) => {
    const { method, url, headers, body, query } = request;

    sentryServer.captureException(error, {
      component: 'api_route',
      action: 'request_handling',
      fingerprint: [`${method}:${url}`],
      extra: {
        method,
        url,
        headers: {
          ...headers,
          authorization: headers?.authorization ? '[FILTERED]' : undefined,
          cookie: headers?.cookie ? '[FILTERED]' : undefined,
        },
        query,
        body: typeof body === 'object' ? '[JSON]' : body?.substring?.(0, 1000),
        ...context,
      },
    });
  },

  // ✅ Функция для отслеживания performance
  tracePerformance: (name: string, operation: () => Promise<any>) => {
    const transaction = Sentry.startTransaction({ name, op: 'custom' });
    const span = transaction.startChild({ op: 'operation' });

    return operation()
      .then((result) => {
        span.finish();
        transaction.finish();
        return result;
      })
      .catch((error) => {
        span.finish();
        transaction.finish();
        sentryServer.captureException(error, { component: 'performance_tracing' });
        throw error;
      });
  },
};

// ✅ Экспорт инициализированного Sentry
export default Sentry;
