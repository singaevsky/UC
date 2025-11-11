import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:author_id(full_name, avatar_url),
        category:category_id(id, name, slug, color),
        blog_media(*),
        post_comments(
          *,
          user:user_id(full_name, avatar_url),
          replies:post_comments(
            id,
            content,
            created_at,
            user:user_id(full_name, avatar_url)
          )
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) throw error;

    // Увеличиваем счетчик просмотров
    await supabase
      .from('posts')
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq('id', params.id);

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

    const { data: { profile } } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['confectioner', 'manager', 'supervisor', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    const updates = await req.json();

    // Устанавливаем обновившего пользователя
    updates.updated_by = user.id;

    // Если публикуем, устанавливаем дату публикации
    if (updates.status === 'published') {
      const { data: currentPost } = await supabase
        .from('posts')
        .select('status, published_at')
        .eq('id', params.id)
        .single();

      if (currentPost?.status !== 'published' && !currentPost?.published_at) {
        updates.published_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('posts')
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

    const { data: { profile } } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['manager', 'supervisor', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error:Недостаточно прав' }, { status: 403 });
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
