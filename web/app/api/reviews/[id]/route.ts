import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles:user_id(full_name, avatar_url),
        products:product_id(name, images),
        confectioner_profiles:confectioner_id(full_name, specialty),
        review_responses(
          id,
          content,
          is_admin_response,
          created_at,
          updated_at,
          responder_profile:responder_id(full_name, role)
        ),
        review_reports(
          id,
          reason,
          description,
          status,
          created_at
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) throw error;

    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    const updates = await req.json();

    // Проверяем права доступа
    const { data: canManage } = await supabase
      .rpc('can_manage_review', { review_id_param: Number(params.id), user_id_param: user.id });

    if (!canManage) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    // Пользователи могут изменять только свои отзывы до модерации
    if (user.id) {
      const { data: review } = await supabase
        .from('reviews')
        .select('user_id, status')
        .eq('id', params.id)
        .single();

      if (review?.user_id === user.id && !['pending', 'under_review'].includes(review.status)) {
        return NextResponse.json({ error: 'Нельзя изменять опубликованные отзывы' }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    // Проверяем права доступа
    const { data: canManage } = await supabase
      .rpc('can_manage_review', { review_id_param: Number(params.id), user_id_param: user.id });

    if (!canManage) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    // Пользователи могут удалять только свои отзывы до модерации
    const { data: review } = await supabase
      .from('reviews')
      .select('user_id, status')
      .eq('id', params.id)
      .single();

    if (review?.user_id === user.id && review.status === 'published') {
      return NextResponse.json({ error: 'Нельзя удалять опубликованные отзывы' }, { status: 400 });
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
