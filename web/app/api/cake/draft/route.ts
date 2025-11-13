// file: app/api/cake/draft/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

const supabase = getServiceRoleClient();

const DraftSchema = z.object({
  userId: z.string().uuid('Некорректный ID пользователя'),
  config: z.record(z.any()).default({}),
});

// GET – получаем черновик пользователя
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId обязательный параметр' },
        { status: 400 }
      );
    }

    // ✅ Валидация UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Некорректный формат userId' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('draft_cakes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      Sentry.captureException(error, {
        tags: {
          endpoint: 'GET /api/cake/draft',
          userId,
        },
      });
      return NextResponse.json(
        { error: 'Ошибка получения черновика' },
        { status: 500 }
      );
    }

    return NextResponse.json({ draft: data ?? null });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: 'GET /api/cake/draft',
      },
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST – создаём / обновляем черновик
export async function POST(req: NextRequest) {
  try {
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
    const parsed = DraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Ошибка валидации',
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const { userId, config } = parsed.data;

    // ✅ Дополнительная проверка конфигурации
    if (config && typeof config !== 'object') {
      return NextResponse.json(
        { error: 'Конфигурация должна быть объектом' },
        { status: 400 }
      );
    }

    // ✅ Проверка размера конфигурации (ограничение 50KB)
    const configString = JSON.stringify(config || {});
    if (configString.length > 50000) {
      return NextResponse.json(
        { error: 'Конфигурация слишком большая (максимум 50KB)' },
        { status: 400 }
      );
    }

    // ✅ Проверка пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // ✅ Upsert операция с обработкой конфликтов
    const { data, error } = await supabase
      .from('draft_cakes')
      .upsert(
        {
          user_id: userId,
          config: config || {},
          updated_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
          access_count: 1, // Будет увеличено триггером
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (error) {
      Sentry.captureException(error, {
        tags: {
          endpoint: 'POST /api/cake/draft',
          userId,
        },
      });
      return NextResponse.json(
        { error: 'Ошибка сохранения черновика' },
        { status: 500 }
      );
    }

    // ✅ Логирование успешного сохранения
    Sentry.addBreadcrumb({
      message: 'Draft saved successfully',
      category: 'draft',
      level: 'info',
      data: {
        userId,
        draftId: data.id,
        configSize: configString.length,
      },
    });

    return NextResponse.json({ draft: data }, { status: 201 });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: 'POST /api/cake/draft',
      },
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE – удаляем черновик (опционально)
export async function DELETE(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId обязательный параметр' },
        { status: 400 }
      );
    }

    // ✅ Мягкое удаление (soft delete)
    const { error } = await supabase
      .from('draft_cakes')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (error) {
      Sentry.captureException(error, {
        tags: {
          endpoint: 'DELETE /api/cake/draft',
          userId,
        },
      });
      return NextResponse.json(
        { error: 'Ошибка удаления черновика' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Черновик удален' });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: 'DELETE /api/cake/draft',
      },
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
