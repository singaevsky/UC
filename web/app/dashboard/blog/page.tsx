"use client";

import { useState, useEffect } from 'react';
import { getClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import type { BlogPost, BlogCategory } from '@/types/blog';

export default function BlogDashboard() {
  const supabase = getClient();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        setUser(user);
        setUserRole(profile?.role || 'user');
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      let query = supabase
        .from('posts')
        .select(`*, author:author_id(full_name), category:category_id(name), post_comments(id)`)
        .order('created_at', { ascending: false });

      if (selectedStatus !== 'all') query = query.eq('status', selectedStatus);
      if (userRole === 'confectioner' || userRole === 'manager') query = query.eq('author_id', user?.id);

      const { data } = await query;
      setPosts(data || []);

      const { data: cats } = await supabase.from('blog_categories').select('*').order('name', { ascending: true });
      setCategories(cats || []);
    })();
  }, [user, selectedStatus]);

  const updatePostStatus = async (id: number, status: string) => {
    const { error } = await supabase.from('posts').update({ status, published_at: status === 'published' ? new Date().toISOString() : null }).eq('id', id);
    if (error) return alert('Ошибка: ' + error.message);
    alert('Статус обновлен');
    // reload posts after update
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    setPosts(data || []);
  };

  const deletePost = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить статью?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) return alert('Ошибка: ' + error.message);
    alert('Статья удалена');
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    setPosts(data || []);
  };

  if (loading) return <div>Загрузка...</div>;

  if (!user || !['confectioner', 'manager', 'supervisor', 'admin'].includes(userRole)) {
    return (
      <div className="card">
        <h1>Блог</h1>
        <p>Недостаточно прав доступа</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Управление блогом</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button onClick={() => { /* open create form */ }}>
            Новая статья
          </Button>
          {(userRole === 'supervisor' || userRole === 'admin') && (
            <Button variant="outline">
              Категории
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>{post.title}</h3>
                  <p style={{ color: '#666', marginBottom: '8px' }}>{post.excerpt}</p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#999' }}>
                    <span>Автор: {post.author?.full_name}</span>
                    <span>Создано: {formatDate(post.created_at)}</span>
                    <span>👁️ {post.views_count || 0} просмотров</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/blog/${post.slug}`}>
                    <Button variant="outline" size="sm">Просмотр</Button>
                  </Link>
                  <Link href={`/dashboard/blog/edit/${post.id}`}>
                    <Button size="sm">Редактировать</Button>
                  </Link>
                  {post.status === 'draft' && <Button size="sm" onClick={() => updatePostStatus(post.id, 'published')} style={{ background: '#4caf50' }}>Опубликовать</Button>}
                  {post.status === 'published' && <Button size="sm" onClick={() => updatePostStatus(post.id, 'draft')} style={{ background: '#ff9800' }}>Снять с публикации</Button>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
