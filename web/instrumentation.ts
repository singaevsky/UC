// file: instrumentation.ts
import './sentry.server.config';
import * as Sentry from '@sentry/nextjs';

// ✅ Глобальная переменная для отслеживания инициализации
let isInitialized = false;

// ✅ Функция безопасной инициализации
async function safeInitialize() {
  if (isInitialized) return;

  try {
    // ✅ Проверяем доступность переменных окружения
    const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
      console.warn(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    // ✅ Инициализация Sentry (уже выполнена в sentry.server.config.ts)
    if (!process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
      console.warn('Sentry DSN not configured');
    }

    isInitialized = true;
    console.log('Instrumentation initialized successfully');

  } catch (error) {
    console.error('Failed to initialize instrumentation:', error);
    // Не бросаем ошибку, чтобы не нарушить запуск приложения
  }
}

// ✅ Функция graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}, starting graceful shutdown...`);

  try {
    // ✅ Завершаем активные транзакции Sentry
    if (Sentry.getCurrentHub()) {
      Sentry.flush(5000).catch((error) => {
        console.error('Error flushing Sentry data:', error);
      });
    }

    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// ✅ Основная функция регистрации
export async function register() {
  await safeInitialize();

  // ✅ Регистрируем обработчики graceful shutdown
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // ✅ Обработка необработанных ошибок
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);

    if (Sentry.getCurrentHub()) {
      Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)), {
        tags: {
          component: 'instrumentation',
          errorType: 'unhandledRejection',
        },
      });
    }
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);

    if (Sentry.getCurrentHub()) {
      Sentry.captureException(error, {
        tags: {
          component: 'instrumentation',
          errorType: 'uncaughtException',
        },
      });
    }

    // Для uncaughtException продолжаем выполнение после логирования
    gracefulShutdown('uncaughtException');
  });
}

// ✅ Дополнительные функции для мониторинга
export const monitoring = {
  // ✅ Отслеживание использования памяти
  trackMemoryUsage: () => {
    const used = process.memoryUsage();
    const memoryInfo = {
      rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
      external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`,
    };

    if (Sentry.getCurrentHub()) {
      Sentry.addBreadcrumb({
        message: 'Memory usage check',
        category: 'performance',
        level: 'info',
        data: memoryInfo,
      });
    }

    return memoryInfo;
  },

  // ✅ Отслеживание времени ответа API
  trackApiResponseTime: (route: string, duration: number) => {
    if (duration > 5000) { // Логируем только медленные запросы
      if (Sentry.getCurrentHub()) {
        Sentry.addBreadcrumb({
          message: `Slow API response: ${route}`,
          category: 'performance',
          level: 'warning',
          data: { route, duration },
        });
      }
    }
  },

  // ✅ Отслеживание ошибок подключения к БД
  trackDatabaseConnection: (operation: string, success: boolean, duration?: number) => {
    if (Sentry.getCurrentHub()) {
      Sentry.addBreadcrumb({
        message: `Database ${operation} ${success ? 'success' : 'failed'}`,
        category: 'database',
        level: success ? 'info' : 'error',
        data: { operation, success, duration },
      });
    }
  },
};

// ✅ Периодический мониторинг (каждые 5 минут)
if (typeof window === 'undefined') { // Только на сервере
  setInterval(() => {
    monitoring.trackMemoryUsage();
  }, 5 * 60 * 1000);
}

// ✅ Экспорт по умолчанию
export default register;
