// file: app/api/test-error/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

// ✅ Типы для rate limiting
interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
}

// ✅ Простой in-memory rate limiter (в production используйте Redis)
const rateLimiter = new Map<string, RateLimitEntry>();

// ✅ Функция проверки rate limit
function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimiter.get(identifier);

  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
      lastRequest: now,
    };
    rateLimiter.set(identifier, newEntry);
    return { allowed: true, remaining: limit - 1, resetTime: newEntry.resetTime };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }

  entry.count++;
  entry.lastRequest = now;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime
  };
}

// ✅ Функция очистки старых записей rate limiter
function cleanupRateLimiter() {
  const now = Date.now();
  for (const [key, entry] of rateLimiter.entries()) {
    if (now > entry.resetTime) {
      rateLimiter.delete(key);
    }
  }
}

// ✅ Типы для запроса тестовой ошибки
interface TestErrorRequest {
  type?: 'exception' | 'message' | 'breadcrumb';
  message?: string;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  context?: Record<string, any>;
}

// ✅ Основной обработчик
export async function GET(req: NextRequest) {
  try {
    // ✅ Получаем идентификатор клиента
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                    req.headers.get('x-real-ip') ||
                    '127.0.0.1';
    const identifier = `${clientIP}:${userAgent}`;

    // ✅ Проверяем rate limit
    const rateLimitCheck = checkRateLimit(identifier);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
            'X-RateLimit-Reset': rateLimitCheck.resetTime.toString(),
          },
        }
      );
    }

    // ✅ Получаем параметры запроса
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || 'exception') as TestErrorRequest['type'];
    const message = searchParams.get('message') || 'Test error from UC application';
    const level = (searchParams.get('level') || 'error') as TestErrorRequest['level'];

    // ✅ Валидация параметров
    const validTypes = ['exception', 'message', 'breadcrumb'];
    const validLevels = ['fatal', 'error', 'warning', 'info', 'debug'];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      );
    }

    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { error: 'Invalid level parameter' },
        { status: 400 }
      );
    }

    // ✅ Создаем тестовую ошибку
    const errorContext = {
      component: 'test_error',
      testEndpoint: true,
      userAgent,
      clientIP,
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method,
    };

    // ✅ Отправляем ошибку в Sentry в зависимости от типа
    switch (type) {
      case 'exception':
        const testError = new Error(message);
        testError.name = 'TestError';
        Sentry.captureException(testError, {
          level: level as Sentry.SeverityLevel,
          extra: errorContext,
          tags: {
            test: 'true',
            source: 'test_endpoint',
          },
        });
        break;

      case 'message':
        Sentry.captureMessage(message, level as Sentry.SeverityLevel);
        Sentry.addBreadcrumb({
          message: `Test message: ${message}`,
          category: 'test',
          level: level as Sentry.SeverityLevel,
          data: errorContext,
        });
        break;

      case 'breadcrumb':
        Sentry.addBreadcrumb({
          message: `Test breadcrumb: ${message}`,
          category: 'test',
          level: level as Sentry.SeverityLevel,
          data: errorContext,
        });
        break;
    }

    // ✅ Периодическая очистка rate limiter
    if (Math.random() < 0.1) { // 10% вероятность
      cleanupRateLimiter();
    }

    // ✅ Возвращаем успешный ответ
    return NextResponse.json({
      success: true,
      message: `Test ${type} sent to Sentry`,
      details: {
        type,
        level,
        message,
        rateLimit: {
          remaining: rateLimitCheck.remaining,
          resetTime: new Date(rateLimitCheck.resetTime).toISOString(),
        },
      },
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
        'X-RateLimit-Reset': rateLimitCheck.resetTime.toString(),
      },
    });

  } catch (error) {
    // ✅ Обработка неожиданных ошибок
    console.error('Unexpected error in test-error endpoint:', error);

    // Отправляем ошибку в Sentry для мониторинга
    Sentry.captureException(error, {
      component: 'test_error',
      extra: {
        endpoint: '/api/test-error',
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to process test error request',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ✅ Дополнительный POST метод для создания контекста
export async function POST(req: NextRequest) {
  try {
    // ✅ Получаем данные из тела запроса
    const body: TestErrorRequest = await req.json();

    // ✅ Валидация тела запроса
    if (body.type && !['exception', 'message', 'breadcrumb'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid type in request body' },
        { status: 400 }
      );
    }

    // ✅ Создаем контекст
    const context = {
      ...body.context,
      component: 'test_error_post',
      testEndpoint: true,
      timestamp: new Date().toISOString(),
      method: 'POST',
    };

    // ✅ Отправляем в Sentry
    switch (body.type) {
      case 'exception':
        const error = new Error(body.message || 'Test exception from POST');
        Sentry.captureException(error, {
          extra: context,
          tags: { test: 'true', method: 'POST' },
        });
        break;

      case 'message':
        Sentry.captureMessage(body.message || 'Test message from POST',
          body.level as Sentry.SeverityLevel || 'info');
        break;

      default:
        // По умолчанию отправляем breadcrumb
        Sentry.addBreadcrumb({
          message: body.message || 'Test breadcrumb from POST',
          category: 'test',
          level: 'info',
          data: context,
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Test data sent to Sentry via POST',
      context,
    });

  } catch (error) {
    console.error('Error in POST test-error endpoint:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
