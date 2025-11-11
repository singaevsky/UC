// file: app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { calculatePrice } from '@/shared/lib/price/priceCalculator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ✅ Схема валидации заказа
const OrderSchema = z.object({
  userId: z.string().uuid('Некорректный ID пользователя'),
  delivery_type: z.enum(['pickup', 'courier', 'sdek'], {
    errorMap: () => ({ message: 'Недопустимый способ доставки' }),
  }),
  delivery_address: z.string().optional(),
  delivery_pickup_point_id: z.string().optional(),
  cake_config: z.record(z.any(), 'Конфигурация торта должна быть объектом'),
  draftId: z.string().uuid('Некорректный ID черновика').optional(),
});

// ✅ Схема для расчёта стоимости доставки
const DELIVERY_PRICES = {
  pickup: 0,
  courier: 300,
  sdek: 150,
} as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ✅ Валидация входных данных
    const parsed = OrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const {
      userId,
      delivery_type,
      delivery_address,
      delivery_pickup_point_id,
      cake_config,
      draftId
    } = parsed.data;

    // ✅ Проверяем существование пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      Sentry.captureException(userError);
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // ✅ Расчёт стоимости торта
    let cakePrice: number;
    try {
      cakePrice = calculatePrice(cake_config);
    } catch (error) {
      Sentry.captureException(error);
      return NextResponse.json(
        { error: 'Ошибка расчёта стоимости торта' },
        { status: 400 }
      );
    }

    // ✅ Расчёт стоимости доставки
    const deliveryPrice = DELIVERY_PRICES[delivery_type];
    const totalPrice = cakePrice + deliveryPrice;

    // ✅ Валидация адреса для курьерской доставки
    if (delivery_type === 'courier' && !delivery_address?.trim()) {
      return NextResponse.json(
        { error: 'Адрес доставки обязателен для курьерской доставки' },
        { status: 400 }
      );
    }

    // ✅ Валидация пункта выдачи для СДЭК
    if (delivery_type === 'sdek' && !delivery_pickup_point_id?.trim()) {
      return NextResponse.json(
        { error: 'Пункт выдачи обязателен для доставки СДЭК' },
        { status: 400 }
      );
    }

    // ✅ Подготавливаем данные для заказа
    const orderData = {
      user_id: userId,
      cake_config,
      cake_price: cakePrice,
      delivery_type,
      delivery_address: delivery_address || null,
      delivery_pickup_point_id: delivery_pickup_point_id || null,
      delivery_price: deliveryPrice,
      total_price: totalPrice,
      status: 'new',
      // Дополнительные поля
      source: 'web',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // ✅ Создаём заказ
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select(`
        *,
        user:users(id, email, full_name)
      `)
      .single();

    if (orderError) {
      Sentry.captureException(orderError);
      return NextResponse.json(
        { error: 'Ошибка создания заказа' },
        { status: 500 }
      );
    }

    // ✅ Если есть draftId, обновляем его статус
    if (draftId) {
      const { error: draftError } = await supabase
        .from('draft_cakes')
        .update({
          status: 'converted_to_order',
          converted_order_id: order.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', draftId)
        .eq('user_id', userId);

      if (draftError) {
        Sentry.captureException(draftError);
        // Не блокируем ответ, только логируем ошибку
      }
    }

    // ✅ Создаём запись в истории статусов
    const { error: statusError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: order.id,
        status: 'new',
        changed_by: userId,
        changed_at: new Date().toISOString(),
        comment: 'Заказ создан',
      });

    if (statusError) {
      Sentry.captureException(statusError);
    }

    // ✅ Возвращаем успешный ответ
    return NextResponse.json(
      {
        order,
        message: 'Заказ успешно создан'
      },
      { status: 201 }
    );

  } catch (error) {
    // ✅ Обработка неожиданных ошибок
    Sentry.captureException(error);

    console.error('Unexpected error in orders API:', error);

    return NextResponse.json(
      {
        error: 'Внутренняя ошибка сервера',
        message: 'Пожалуйста, попробуйте позже'
      },
      { status: 500 }
    );
  }
}

// ✅ API для получения списка заказов пользователя
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId параметр обязателен' },
        { status: 400 }
      );
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:users(id, email, full_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      Sentry.captureException(error);
      return NextResponse.json(
        { error: 'Ошибка получения заказов' },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders });

  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
