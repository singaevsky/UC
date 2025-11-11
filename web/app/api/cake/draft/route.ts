// file: app/api/cake/draft/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';

// ---------------------------------------------------
// 1️⃣  Supabase – читаем (anon) и пишем (service role)
// ---------------------------------------------------
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } } // серверный клиент, сессии не нужны
);

// ВАЖНО!  SERVICE_ROLE_KEY никогда не попадает в браузер.
// Хранится только в переменных окружения сервера (Vercel, Netlify, …)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ---------------------------------------------------
// 2️⃣  Схема входных данных (валидация Zod)
// ---------------------------------------------------
const DraftSchema = z.object({
  userId: z.string().uuid(),
  config: z.record(z.any()).default({}),          // любой JSON‑объект
  draftId: z.string().uuid().optional(),         // если передаём id – будем обновлять
});

/** ----------------------------------------------------
 *  GET  /api/cake/draft
 *  ----------------------------------------------------
 *  Параметры (query):
 *    - id=<uuid>   – взять черновик по его первичному ключу
 *    - userId=<uuid> – взять последний черновик пользователя
 *
 *  Возвращает:
 *    { draft: Draft | null }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') ?? '';
  const userId = searchParams.get('userId') ?? '';

  if (!id && !userId) {
    return NextResponse.json(
      { error: 'Нужно передать either id or userId' },
      { status: 400 }
    );
  }

  try {
    let query = supabaseAnon.from('draft_cakes').select('*');

    if (id) {
      // Выбираем конкретный черновик
      const { data, error } = await query.eq('id', id).maybeSingle();
      if (error) throw error;
      return NextResponse.json({ draft: data });
    } else {
      // Последний (по updated_at) черновик пользователя
      const { data, error } = await query
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return NextResponse.json({ draft: data });
    }
  } catch (e: any) {
    // Страхуем Sentry‑ом
    // import * as Sentry from '@sentry/nextjs';
    // Sentry.captureException(e);
    return NextResponse.json(
      { error: e?.message ?? 'Ошибка при получении черновика' },
      { status: 500 }
    );
  }
}

/** ----------------------------------------------------
 *  POST /api/cake/draft
 *  ----------------------------------------------------
 *  Тело запроса (JSON):
 *    {
 *      "userId": "<uuid>",
 *      "config": { … },          // любой объект, сохраняем как jsonb
 *      "draftId": "<uuid>"?      // если передан – обновляем эту запись
 *    }
 *
 *  Возвращает:
 *    { draft: Draft }
 *
 *  Заметки:
 *    - При успешном изменении вызываем revalidateTag('draft'),
 *      чтобы ISR‑страницы, использующие этот тег, пере‑рендерились.
 */
export async function POST(req: NextRequest) {
  // ---------------------------------------------------
  // 2️⃣  Парсим и валидируем входные данные
  // ---------------------------------------------------
  const raw = await req.json();
  const parsed = DraftSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { userId, config, draftId } = parsed.data;

  // ---------------------------------------------------
  // 3️⃣  (Опционально) Проверяем, что пользователь,
  //     отправивший запрос, действительно тот, кто указан
  //     в userId. Если вы используете Supabase Auth, то
  //     раскомментируйте блок ниже:
  // ---------------------------------------------------
  // const authHeader = req.headers.get('Authorization');
  // const token = authHeader?.replace('Bearer ', '');
  // if (token) {
  //   const { data: user, error } = await supabaseAnon.auth.getUser(token);
  //   if (error || !user) {
  //     return NextResponse.json({ error: 'Невалидный токен' }, { status: 401 });
  //   }
  //   if (user.id !== userId) {
  //     return NextResponse.json(
  //       { error: 'userId не совпадает с uid токена' },
  //       { status: 403 }
  //     );
  //   }
  // }

  // ---------------------------------------------------
  // 4️⃣  Выполняем запись/обновление
  // ---------------------------------------------------
  try {
    let saved;

    if (draftId) {
      // Обновляем существующую запись, только если она принадлежит пользователю
      const { data, error } = await supabaseAdmin
        .from('draft_cakes')
        .update({ config, updated_at: new Date().toISOString() })
        .eq('id', draftId)
        .eq('user_id', userId) // двойная проверка – лишнее, но полезно
        .select()
        .single();

      if (error) {
        // Если запись не найдена – 404
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Черновик не найден' }, { status: 404 });
        }
        throw error;
      }
      saved = data;
    } else {
      // Если в вашей схеме установлен уникальный индекс по `user_id`,
      // то upsert гарантированно оставит только одну запись.
      // Если индекса нет – мы всё равно пишем новую запись.
      const { data, error } = await supabaseAdmin
        .from('draft_cakes')
        .upsert({ user_id: userId, config })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      saved = data;
    }

    // ---------------------------------------------------
    // 5️⃣  Пересобираем кеш ISR‑страниц, где используем тег `draft`
    // ---------------------------------------------------
    revalidateTag('draft');

    return NextResponse.json({ draft: saved });
  } catch (e: any) {
    // Sentry.captureException(e);
    return NextResponse.json(
      { error: e?.message ?? 'Ошибка при сохранении черновика' },
      { status: 500 }
    );
  }
}
