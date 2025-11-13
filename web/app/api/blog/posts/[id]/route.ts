
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient()

        // Получаем данные поста из базы данных
        const { data: post, error } = await supabase
            .from('blog_posts')
            .select(`
                *,
                blog_categories (
                    id,
                    name,
                    slug
                )
            `)
            .eq('id', params.id)
            .eq('status', 'published')
            .single()

        if (error) {
            console.error('Error fetching post:', error)
            return NextResponse.json(
                { error: 'Пост не найден' },
                { status: 404 }
            )
        }

        if (!post) {
            return NextResponse.json(
                { error: 'Пост не найден' },
                { status: 404 }
            )
        }

        return NextResponse.json({ data: post })
    } catch (error: any) {
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Внутренняя ошибка сервера' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient()
        const cookieStore = cookies()
        const userId = cookieStore.get('sb-access-token')?.value

        if (!userId) {
            return NextResponse.json(
                { error: 'Недостаточно прав' },
                { status: 403 }
            )
        }

        // Проверяем права пользователя
        const { data: user, error: userError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', userId)
            .single()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Пользователь не найден' },
                { status: 404 }
            )
        }

        // Проверяем права на редактирование
        if (!['admin', 'editor', 'author'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Недостаточно прав для редактирования' },
                { status: 403 }
            )
        }

        const body = await request.json()

        // Валидация данных
        if (!body.title || !body.content) {
            return NextResponse.json(
                { error: 'Заголовок и содержание обязательны' },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from('blog_posts')
            .update({
                ...body,
                updated_at: new Date().toISOString(),
                updated_by: userId
            })
            .eq('id', params.id)
            .select()
            .single()

        if (error) {
            console.error('Error updating post:', error)
            return NextResponse.json(
                { error: 'Ошибка при обновлении поста' },
                { status: 500 }
            )
        }

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Внутренняя ошибка сервера' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient()
        const cookieStore = cookies()
        const userId = cookieStore.get('sb-access-token')?.value

        if (!userId) {
            return NextResponse.json(
                { error: 'Недостаточно прав' },
                { status: 403 }
            )
        }

        // Проверяем права пользователя
        const { data: user, error: userError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', userId)
            .single()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Пользователь не найден' },
                { status: 404 }
            )
        }

        // Только админ может удалять посты
        if (user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Недостаточно прав для удаления' },
                { status: 403 }
            )
        }

        // Удаляем пост (сначала связанные комментарии)
        const { error: commentsError } = await supabase
            .from('blog_comments')
            .delete()
            .eq('post_id', params.id)

        if (commentsError) {
            console.error('Error deleting comments:', commentsError)
        }

        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', params.id)

        if (error) {
            console.error('Error deleting post:', error)
            return NextResponse.json(
                { error: 'Ошибка при удалении поста' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Внутренняя ошибка сервера' },
            { status: 500 }
        )
    }
}
