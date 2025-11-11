// file: lib/logrocket.ts
'use client';

import LogRocket from 'logrocket';

// ✅ Инициализация LogRocket
function initializeLogRocket() {
  if (typeof window === 'undefined') return;

  const appId = process.env.NEXT_PUBLIC_LOGROCKET_APP_ID;

  if (!appId) {
    console.warn('LogRocket App ID not found in environment variables');
    return;
  }

  try {
    LogRocket.init(appId, {
      // ✅ Конфигурация LogRocket
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      dom: {
        // Скрываем чувствительные данные
        inputSanitizer: true,
        // Маскируем текстовые поля
        textMaskSelectors: [
          'input[type="password"]',
          'input[type="email"]',
          'input[type="tel"]',
        ],
      },
      network: {
        // Логируем сетевые запросы
        isEnabled: true,
        // Исключаем sensitive endpoints
        blacklistUrls: [
          '/api/auth/login',
          '/api/auth/register',
          '/api/payments',
        ],
      },
      console: {
        // Логируем console сообщения
        isEnabled: true,
        // Исключаем debug сообщения в production
        whitelist: process.env.NODE_ENV === 'development' ? undefined : ['error', 'warn'],
      },
    });

    // ✅ Дополнительные настройки
    LogRocket.setUserIDGenerator((userID: string) => {
      return `user_${userID}`;
    });

    console.log('LogRocket initialized successfully');

  } catch (error) {
    console.error('Failed to initialize LogRocket:', error);
  }
}

// ✅ Функция идентификации пользователя
export function identifyUser(userId: string, userInfo?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  try {
    LogRocket.identify(userId, {
      name: userInfo?.fullName || userInfo?.name,
      email: userInfo?.email,
      phone: userInfo?.phone,
      // Добавляем дополнительную информацию
      plan: userInfo?.subscription || 'free',
      created_at: userInfo?.createdAt,
      ...userInfo,
    });

    console.log(`User identified: ${userId}`);
  } catch (error) {
    console.error('Failed to identify user in LogRocket:', error);
  }
}

// ✅ Функция для отслеживания событий
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  try {
    LogRocket.track(eventName, properties);
    console.log(`Event tracked: ${eventName}`, properties);
  } catch (error) {
    console.error('Failed to track event in LogRocket:', error);
  }
}

// ✅ Функция для логирования ошибок
export function captureException(error: Error, context?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  try {
    LogRocket.captureException(error, {
      extra: context,
      tags: {
        component: context?.component,
        action: context?.action,
      },
    });

    console.error('Exception captured in LogRocket:', error);
  } catch (logError) {
    console.error('Failed to capture exception in LogRocket:', logError);
  }
}

// ✅ Функция для логирования сообщений
export function captureMessage(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  if (typeof window === 'undefined') return;

  try {
    LogRocket.captureMessage(message, {
      level,
    });

    console.log(`Message captured in LogRocket: ${message}`);
  } catch (error) {
    console.error('Failed to capture message in LogRocket:', error);
  }
}

// ✅ Функция для начала сессии
export function startSession(sessionName?: string) {
  if (typeof window === 'undefined') return;

  try {
    LogRocket.track(sessionName || 'session_started');
    console.log('Session started in LogRocket');
  } catch (error) {
    console.error('Failed to start session in LogRocket:', error);
  }
}

// ✅ Функция для завершения сессии
export function endSession(reason?: string) {
  if (typeof window === 'undefined') return;

  try {
    LogRocket.track('session_ended', { reason });
    console.log('Session ended in LogRocket');
  } catch (error) {
    console.error('Failed to end session in LogRocket:', error);
  }
}

// ✅ Автоматическая инициализация при импорте
initializeLogRocket();

// ✅ Дополнительные утилиты для интеграции с аналитикой
export const logrocketHelpers = {
  trackPageView: (pageName: string) => {
    trackEvent('page_view', { page_name: pageName });
  },

  trackUserAction: (action: string, details?: Record<string, any>) => {
    trackEvent('user_action', { action, ...details });
  },

  trackError: (error: Error, context?: Record<string, any>) => {
    captureException(error, { source: 'user_action', ...context });
  },

  setCustomData: (key: string, value: any) => {
    if (typeof window !== 'undefined') {
      LogRocket.addRawMetadata({ [key]: value });
    }
  },
};

export default LogRocket;
