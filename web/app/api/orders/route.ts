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
  contact: z.object({
    name: z.string().min(1, 'Имя обязательно'),
    phone: z.string().min(10, 'Телефон должен содержать минимум 10 цифр'),
    email: z.string().email('Некорректный email'),
  }),
  comment: z.string().max(500, 'Комментарий слишком длинный').optional(),
});

// ✅ Схема для расчёта стоимости доставки
const DELIVERY_PRICES = {
  pickup: 0,
  courier: 300,
  sdek: 150,
} as const;

// ✅ Схема для ответа API
const OrderResponseSchema = z.object({
  order: z.object({
    id: z.string(),
    user_id: z.string(),
    cake_config: z.record(z.any()),
    total_price: z.number(),
    status: z.string(),
    created_at: z.string(),
  }),
  message: z.string(),
});

// POST - создание заказа
export async function POST(req: NextRequest) {
  try {
    // ✅ Безопасный парсинг JSON
    let body: any;

    try {
      const text = await req.text();
      if (!text.trim()) {
        return NextResponse.json(
          { error: 'Тело запроса не должно быть пустым' },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Некорректный JSON в теле запроса' },
        { status: 400 }
      );
    }

    // ✅ Валидация входных данных
    const parsed = OrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Ошибка валидации',
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
      draftId,
      contact,
      comment,
    } = parsed.data;

    // ✅ Валидация конфигурации торта
    if (!cake_config || typeof cake_config !== 'object') {
      return NextResponse.json(
        { error: 'Конфигурация торта должна быть валидным объектом' },
        { status: 400 }
      );
    }

    // ✅ Проверка размера конфигурации (ограничение 100KB)
    const configString = JSON.stringify(cake_config);
    if (configString.length > 100000) {
      return NextResponse.json(
        { error: 'Конфигурация торта слишком большая (максимум 100KB)' },
        { status: 400 }
      );
    }

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
      Sentry.captureException(error, {
        tags: {
          component: 'price_calculation',
          userId,
        },
      });
      return NextResponse.json(
        { error: 'Ошибка расчёта стоимости торта' },
        { status: 400 }
      );
    }

    // ✅ Расчёт стоимости доставки
    const deliveryPrice = DELIVERY_PRICES[delivery_type];
    const totalPrice = cakePrice + deliveryPrice;

    // ✅ Валидация адреса для курьерской доставки
    if (delivery_type === 'courier') {
      if (!delivery_address?.trim()) {
        return NextResponse.json(
          { error: 'Адрес доставки обязателен для курьерской доставки' },
          { status: 400 }
        );

        // ✅ Дополнительная валидация адреса
        const addressRegex = /^[а-яё\s\d\.\-\,]+$/i;
        if (!addressRegex.test(delivery_address)) {
          return NextResponse.json(
            { error: 'Некорректный формат адреса доставки' },
            { status: 400 }
          );
        }
      }
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

      // ✅ Контактная информация
      contact_name: contact.name,
      contact_phone: contact.phone,
      contact_email: contact.email,
      comment: comment || null,

      // ✅ Дополнительные поля
      source: 'web',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // ✅ Метаданные
      user_agent: req.headers.get('user-agent'),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
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
      Sentry.captureException(orderError, {
        tags: {
          component: 'order_creation',
          userId,
        },
      });
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', draftId)
        .eq('user_id', userId);

      if (draftError) {
        Sentry.captureException(draftError, {
          tags: {
            component: 'draft_update',
            userId,
            draftId,
          },
        });
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
        comment: 'Заказ создан через веб-интерфейс',
        metadata: {
          source: 'web',
          cake_price: cakePrice,
          delivery_price: deliveryPrice,
          total_price: totalPrice,
        },
      });

    if (statusError) {
      Sentry.captureException(statusError, {
        tags: {
          component: 'status_history',
          orderId: order.id,
        },
      });
    }

    // ✅ Логирование успешного создания заказа
    Sentry.addBreadcrumb({
      message: 'Order created successfully',
      category: 'order',
      level: 'info',
      data: {
        orderId: order.id,
        userId,
        totalPrice,
        deliveryType: delivery_type,
      },
    });

    // ✅ Валидация ответа
    const validatedResponse = OrderResponseSchema.parse({
      order,
      message: 'Заказ успешно создан',
    });

    // ✅ Возвращаем успешный ответ
    return NextResponse.json(validatedResponse, { status: 201 });

  } catch (error) {
    // ✅ Обработка неожиданных ошибок
    Sentry.captureException(error, {
      tags: {
        component: 'order_api',
        endpoint: 'POST /api/orders',
      },
    });

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

// GET - получение списка заказов пользователя
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const orderId = req.nextUrl.searchParams.get('orderId');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    if (!userId && !orderId) {
      return NextResponse.json(
        { error: 'Необходим параметр userId или orderId' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        user:users(id, email, full_name),
        draft:public.draft_cakes(id, title)
      `);

    if (orderId) {
      query = query.eq('id', orderId);
    } else {
      query = query.eq('user_id', userId);
    }

    // ✅ Сортировка и пагинация
    const { data: orders, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      Sentry.captureException(error, {
        tags: {
          component: 'orders_retrieval',
          userId: userId || 'unknown',
        },
      });
      return NextResponse.json(
        { error: 'Ошибка получения заказов' },
        { status: 500 }
      );
    }

    // ✅ Получаем общее количество для пагинации
    let totalCount = 0;
    if (!orderId && userId) {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      totalCount = count || 0;
    }

    return NextResponse.json({
      orders: orders || [],
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit,
      },
    });

  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'orders_api',
        endpoint: 'GET /api/orders',
      },
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PATCH - обновление заказа (только для админов или владельца)
export async function PATCH(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get('orderId');
    const userId = req.nextUrl.searchParams.get('userId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Необходим параметр orderId' },
        { status: 400 }
      );
    }

    // ✅ Парсим тело запроса
    let body: any;
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Некорректный JSON' },
        { status: 400 }
      );
    }

    // ✅ Валидация пользователя (проверяем права доступа)
    if (userId) {
      const { data: order } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .single();

      if (!order || order.user_id !== userId) {
        return NextResponse.json(
          { error: 'Недостаточно прав для обновления этого заказа' },
          { status: 403 }
        );
      }
    }

    // ✅ Разрешенные поля для обновления
    const allowedFields = ['status', 'delivery_address', 'comment'];
    const updateData: any = { updated_at: new Date().toISOString() };

    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    });

    if (Object.keys(updateData).length === 1) { // Только updated_at
      return NextResponse.json(
        { error: 'Нет данных для обновления' },
        { status: 400 }
      );
    }

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      Sentry.captureException(error, {
        tags: {
          component: 'order_update',
          orderId,
        },
      });
      return NextResponse.json(
        { error: 'Ошибка обновления заказа' },
        { status: 500 }
      );
    }

    // ✅ Логирование изменения статуса
    if (updateData.status && updateData.status !== updatedOrder.status) {
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: updateData.status,
          changed_by: userId || 'system',
          changed_at: new Date().toISOString(),
          comment: `Статус изменен на ${updateData.status}`,
        });
    }

    return NextResponse.json({
      order: updatedOrder,
      message: 'Заказ успешно обновлен'
    });

  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'orders_api',
        endpoint: 'PATCH /api/orders',
      },
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE - отмена заказа
export async function DELETE(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get('orderId');
    const userId = req.nextUrl.searchParams.get('userId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Необходим параметр orderId' },
        { status: 400 }
      );
    }

    // ✅ Проверяем права доступа
    if (userId) {
      const { data: order } = await supabase
        .from('orders')
        .select('user_id, status')
        .eq('id', orderId)
        .single();

      if (!order || order.user_id !== userId) {
        return NextResponse.json(
          { error: 'Недостаточно прав для отмены этого заказа' },
          { status: 403 }
        );
      }

      if (['completed', 'cancelled'].includes(order.status)) {
        return NextResponse.json(
          { error: 'Нельзя отменить завершенный или уже отмененный заказ' },
          { status: 400 }
        );
      }
    }

    // ✅ Отменяем заказ
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      Sentry.captureException(error, {
        tags: {
          component: 'order_cancellation',
          orderId,
        },
      });
      return NextResponse.json(
        { error: 'Ошибка отмены заказа' },
        { status: 500 }
      );
    }

    // ✅ Записываем в историю
    await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status: 'cancelled',
        changed_by: userId || 'user',
        changed_at: new Date().toISOString(),
        comment: 'Заказ отменен пользователем',
      });

    return NextResponse.json({
      message: 'Заказ успешно отменен'
    });

  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'orders_api',
        endpoint: 'DELETE /api/orders',
      },
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
