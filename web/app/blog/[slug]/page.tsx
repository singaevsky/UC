import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function PostPage({ params }: { params: { slug: string }}) {
  const supabase = createServerComponentClient({ cookies });
  const { data: post } = await supabase.from('posts').select('*').eq('slug', params.slug).eq('status','published').single();
  if (!post) return <div>Статья не найдена</div>;
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
