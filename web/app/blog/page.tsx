import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import FadeIn from '@/components/animations/FadeIn';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createServerComponentClient({ cookies });
  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt, cover_url, meta_title, meta_description')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!post) {
    return {
      title: 'Статья не найдена - Блог Уездный кондитер'
    };
  }

  return {
    title: post.meta_title || `${post.title} - Блог Уездный кондитер`,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.cover_url ? [post.cover_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const supabase = createServerComponentClient({ cookies });

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:author_id(full_name, avatar_url),
      category:category_id(name, slug, color),
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
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (error || !post) {
    notFound();
  }

  // Получаем связанные посты
  const { data: relatedPosts } = await supabase
    .from('posts')
    .select(`
      id, title, slug, excerpt, cover_url, published_at,
      category:category_id(name, slug, color)
    `)
    .eq('status', 'published')
    .eq('category_id', post.category_id)
    .neq('id', post.id)
    .limit(3);

  return (
    <FadeIn>
      <div className="max-w-4xl mx-auto">
        {/* Навигация */}
        <nav style={{ marginBottom: '16px' }}>
          <Link href="/blog" style={{ color: '#666', textDecoration: 'none' }}>
            ← Вернуться к блогу
          </Link>
        </nav>

        {/* Заголовок статьи */}
        <header style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            {post.category && (
              <Link
                href={`/blog?category=${post.category.id}`}
                className="badge"
                style={{ background: post.category.color }}
              >
                {post.category.name}
              </Link>
            )}
            {post.featured && (
              <span className="badge" style={{ background: '#ff9800' }}>
                ⭐ Рекомендуем
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '32px', marginBottom: '16px', lineHeight: 1.2 }}>
            {post.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#666', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {post.author?.avatar_url ? (
                <Image
                  src={post.author.avatar_url}
                  alt={post.author.full_name}
                  width={32}
                  height={32}
                  style={{ borderRadius: '50%' }}
                />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: '#ddd',
                  borderRadius: '50%'
                }} />
              )}
              <span>{post.author?.full_name}</span>
            </div>
            <span>{formatDate(post.published_at)}</span>
            {post.reading_time && <span>{post.reading_time} мин чтения</span>}
            <span>👁️ {post.views_count} просмотров</span>
          </div>
        </header>

        {/* Обложка */}
        {post.cover_url && (
          <div style={{ marginBottom: '32px' }}>
            <Image
              src={post.cover_url}
              alt={post.cover_alt || post.title}
              width={800}
              height={400}
              style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
            />
          </div>
        )}

        {/* Краткое описание */}
        {post.excerpt && (
          <div className="card" style={{ marginBottom: '32px', fontSize: '18px', fontStyle: 'italic' }}>
            {post.excerpt}
          </div>
        )}

        {/* Контент статьи */}
        <article className="card" style={{ marginBottom: '32px' }}>
          <div
            style={{
              lineHeight: 1.7,
              fontSize: '16px'
            }}
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />
        </article>

        {/* Теги */}
        {post.tags && post.tags.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '8px' }}>Теги:</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {post.tags.map((tag) => (
                <span key={tag} className="badge">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Навигация между статьями */}
        <div className="card" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn--outline">
              ← Предыдущая статья
            </button>
            <button className="btn--outline">
              Следующая статья →
            </button>
          </div>
        </div>

        {/* Комментарии */}
        {post.post_comments && post.post_comments.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '16px' }}>
              Комментарии ({post.post_comments.length})
            </h3>
            <div className="space-y-4">
              {post.post_comments.filter(comment => !comment.parent_id).map((comment) => (
                <div key={comment.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {comment.user?.avatar_url ? (
                      <Image
                        src={comment.user.avatar_url}
                        alt={comment.user.full_name}
                        width={32}
                        height={32}
                        style={{ borderRadius: '50%' }}
                      />
                    ) : (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: '#ddd',
                        borderRadius: '50%'
                      }} />
                    )}
                    <div>
                      <strong>{comment.user?.full_name || 'Аноним'}</strong>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {formatDate(comment.created_at)}
                      </div>
                    </div>
                  </div>
                  <p style={{ marginBottom: '8px' }}>{comment.content}</p>

                  {/* Ответы на комментарий */}
                  {post.post_comments.filter(reply => reply.parent_id === comment.id).map((reply) => (
                    <div key={reply.id} style={{ marginLeft: '24px', marginTop: '12px', paddingLeft: '12px', borderLeft: '2px solid #eee' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {reply.user?.avatar_url ? (
                          <Image
                            src={reply.user.avatar_url}
                            alt={reply.user.full_name}
                            width={24}
                            height={24}
                            style={{ borderRadius: '50%' }}
                          />
                        ) : (
                          <div style={{
                            width: '24px',
                            height: '24px',
                            background: '#ddd',
                            borderRadius: '50%'
                          }} />
                        )}
                        <div>
                          <strong style={{ fontSize: '14px' }}>{reply.user?.full_name || 'Аноним'}</strong>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {formatDate(reply.created_at)}
                          </div>
                        </div>
                      </div>
                      <p style={{ fontSize: '14px', margin: 0 }}>{reply.content}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Похожие статьи */}
        {relatedPosts && relatedPosts.length > 0 && (
          <div>
            <h3 style={{ marginBottom: '16px' }}>Похожие статьи</h3>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {relatedPosts.map((relatedPost) => (
                <div key={relatedPost.id} className="card">
                  {relatedPost.cover_url && (
                    <Image
                      src={relatedPost.cover_url}
                      alt={relatedPost.title}
                      width={250}
                      height={150}
                      style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  )}
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {relatedPost.category && (
                        <span
                          className="badge"
                          style={{ background: relatedPost.category.color, fontSize: '10px' }}
                        >
                          {relatedPost.category.name}
                        </span>
                      )}
                    </div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                      <Link href={`/blog/${relatedPost.slug}`}>
                        {relatedPost.title}
                      </Link>
                    </h4>
                    <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                      {formatDate(relatedPost.published_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </FadeIn>
  );
}
