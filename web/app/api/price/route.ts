// file: app/api/price/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { calculatePrice } from '@/shared/lib/price/priceCalculator';

// ✅ Схема валидации запроса
const PriceRequestSchema = z.object({
  config: z.record(z.any(), {
    errorMap: () => ({ message: 'Конфигурация должна быть объектом' })
  }),
  userId: z.string().uuid('Некорректный ID пользователя').optional(),
});

// ✅ Схема ответа
const PriceResponseSchema = z.object({
  price: z.number().min(0, 'Цена не может быть отрицательной'),
  breakdown: z.object({
    basePrice: z.number(),
    layersCost: z.number(),
    decorationCost: z.number(),
    shapeMultiplier: z.number(),
    totalPrice: z.number(),
  }).optional(),
  recommendations: z.array(z.string()).optional(),
});

// ✅ Простой rate limiter (в продакшене используйте Redis)
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimiter.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimiter.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // ✅ Получаем идентификатор для rate limiting
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const clientIP = req.headers.get('x-forwarded-for') ||
                    req.headers.get('x-real-ip') ||
                    'unknown';
    const identifier = `${clientIP}:${userAgent}`;

    // ✅ Проверяем rate limit
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // ✅ Валидация входных данных
    const parsed = PriceRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const { config, userId } = parsed.data;

    // ✅ Дополнительная валидация конфигурации
    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'Конфигурация торта обязательна' },
        { status: 400 }
      );
    }

    try {
      // ✅ Расчёт цены
      const price = calculatePrice(config);

      // ✅ Валидация результата
      const validatedResponse = PriceResponseSchema.parse({
        price,
        // Добавляем breakdown и рекомендации, если нужно
      });

      // ✅ Логирование для аналитики
      if (userId) {
        console.log(`Price calculated for user ${userId}: ${price}`);
      }

      return NextResponse.json(validatedResponse);

    } catch (calcError) {
      // ✅ Ошибки валидации конфигурации
      Sentry.captureException(calcError);

      if (calcError instanceof Error && calcError.message.includes('Некорректная конфигурация')) {
        return NextResponse.json(
          {
            error: 'Некорректная конфигурация торта',
            details: calcError.message
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Ошибка расчёта стоимости' },
        { status: 500 }
      );
    }

  } catch (error) {
    // ✅ Обработка неожиданных ошибок
    Sentry.captureException(error);

    console.error('Unexpected error in price API:', error);

    return NextResponse.json(
      {
        error: 'Внутренняя ошибка сервера',
        message: 'Пожалуйста, попробуйте позже'
      },
      { status: 500 }
    );
  }
}

// ✅ GET метод для получения прайс-листа (опционально)
export async function GET(req: NextRequest) {
  try {
    // ✅ Пример возврата базовых цен
    const basePrices = {
      shapes: {
        round: 1.0,
        square: 1.1,
      },
      layers: {
        biscuit: 1.0,
        cream: 0.8,
        topping: 0.5,
      },
      basePrice: 1000,
      decorationPrice: 50,
    };

    return NextResponse.json({
      message: 'Price calculation API',
      basePrices,
      documentation: 'POST /api/price with { config: CakeConfig } to calculate price',
    });

  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
