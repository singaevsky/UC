"use client";

import { useState, useEffect } from 'react';
import { getClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadPosts();
      loadCategories();
    }
  }, [user, selectedStatus]);

  const loadUser = async () => {
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
  };

  const loadPosts = async () => {
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:author_id(full_name),
        category:category_id(name),
        post_comments(id)
      `)
      .order('created_at', { ascending: false });

    if (selectedStatus !== 'all') {
      query = query.eq('status', selectedStatus);
    }

    if (userRole === 'confectioner' || userRole === 'manager') {
      query = query.eq('author_id', user?.id);
    }

    const { data } = await query;
    setPosts(data || []);
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name', { ascending: true });
    setCategories(data || []);
  };

  const updatePostStatus = async (id: number, status: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          status,
          published_at: status === 'published' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;

      alert('Статус обновлен');
      loadPosts();
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    }
  };

  const deletePost = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить статью?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Статья удалена');
      loadPosts();
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    }
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
          <Button onClick={() => setShowCreateForm(true)}>
            Новая статья
          </Button>
          {(userRole === 'supervisor' || userRole === 'admin') && (
            <Button variant="outline">
              Категории
            </Button>
          )}
        </div>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <CardContent>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div>
              <label>Статус:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input"
                style={{ marginLeft: '8px', width: 'auto' }}
              >
                <option value="all">Все</option>
                <option value="draft">Черновики</option>
                <option value="published">Опубликованные</option>
              </select>
            </div>
            <div>
              <label>Категория:</label>
              <select className="input" style={{ marginLeft: '8px', width: '200px' }}>
                <option value="">Все категории</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <CardHeader>
            <CardTitle>Всего статей</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {posts.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Опубликовано</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4caf50' }}>
              {posts.filter(p => p.status === 'published').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Черновики</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff9800' }}>
              {posts.filter(p => p.status === 'draft').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Просмотры</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {posts.reduce((sum, p) => sum + (p.views_count || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {post.category && (
                      <span className="badge" style={{ background: post.category.color }}>
                        {post.category.name}
                      </span>
                    )}
                    {post.featured && (
                      <span className="badge" style={{ background: '#ff9800' }}>
                        ⭐ Рекомендуемая
                      </span>
                    )}
                    <span className={`badge status-${post.status}`}>
                      {post.status === 'published' ? 'Опубликовано' : 'Черновик'}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 8px 0' }}>{post.title}</h3>
                  <p style={{ color: '#666', marginBottom: '8px' }}>
                    {post.excerpt}
                  </p>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#999' }}>
                    <span>Автор: {post.author?.full_name}</span>
                    <span>Создано: {formatDate(post.created_at)}</span>
                    {post.published_at && (
                      <span>Опубликовано: {formatDate(post.published_at)}</span>
                    )}
                    <span>👁️ {post.views_count || 0} просмотров</span>
                    {post.post_comments && post.post_comments.length > 0 && (
                      <span>💬 {post.post_comments.length} комментариев</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/blog/${post.slug}`}>
                    <Button variant="outline" size="sm">
                      Просмотр
                    </Button>
                  </Link>
                  <Link href={`/dashboard/blog/edit/${post.id}`}>
                    <Button size="sm">
                      Редактировать
                    </Button>
                  </Link>
                  {post.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => updatePostStatus(post.id, 'published')}
                      style={{ background: '#4caf50' }}
                    >
                      Опубликовать
                    </Button>
                  )}
                  {post.status === 'published' && (
                    <Button
                      size="sm"
                      onClick={() => updatePostStatus(post.id, 'draft')}
                      style={{ background: '#ff9800' }}
                    >
                      Снять с публикации
                    </Button>
                  )}
                  {(userRole === 'manager' || userRole === 'supervisor' || userRole === 'admin') && (
                    <Button
                      size="sm"
                      onClick={() => deletePost(post.id)}
                      style={{ background: '#f44336' }}
                    >
                      Удалить
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>Статей пока нет</h3>
          <p>Создайте первую статью для вашего блога</p>
          <Button onClick={() => setShowCreateForm(true)}>
            Создать статью
          </Button>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect } from 'react';
import { getClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadPosts();
      loadCategories();
    }
  }, [user, selectedStatus]);

  const loadUser = async () => {
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
  };

  const loadPosts = async () => {
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:author_id(full_name),
        category:category_id(name),
        post_comments(id)
      `)
      .order('created_at', { ascending: false });

    if (selectedStatus !== 'all') {
      query = query.eq('status', selectedStatus);
    }

    if (userRole === 'confectioner' || userRole === 'manager') {
      query = query.eq('author_id', user?.id);
    }

    const { data } = await query;
    setPosts(data || []);
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name', { ascending: true });
    setCategories(data || []);
  };

  const updatePostStatus = async (id: number, status: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          status,
          published_at: status === 'published' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;

      alert('Статус обновлен');
      loadPosts();
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    }
  };

  const deletePost = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить статью?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Статья удалена');
      loadPosts();
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    }
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
          <Button onClick={() => setShowCreateForm(true)}>
            Новая статья
          </Button>
          {(userRole === 'supervisor' || userRole === 'admin') && (
            <Button variant="outline">
              Категории
            </Button>
          )}
        </div>
      </div>

      {/* Filters and posts list (omitted for brevity in dashboard) */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {post.category && (
                      <span className="badge" style={{ background: post.category.color }}>
                        {post.category.name}
                      </span>
                    )}
                    {post.featured && (
                      <span className="badge" style={{ background: '#ff9800' }}>
                        ⭐ Рекомендуемая
                      </span>
                    )}
                    <span className={`badge status-${post.status}`}>
                      {post.status === 'published' ? 'Опубликовано' : 'Черновик'}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 8px 0' }}>{post.title}</h3>
                  <p style={{ color: '#666', marginBottom: '8px' }}>
                    {post.excerpt}
                  </p>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#999' }}>
                    <span>Автор: {post.author?.full_name}</span>
                    <span>Создано: {formatDate(post.created_at)}</span>
                    {post.published_at && (
                      <span>Опубликовано: {formatDate(post.published_at)}</span>
                    )}
                    <span>👁️ {post.views_count || 0} просмотров</span>
                    {post.post_comments && post.post_comments.length > 0 && (
                      <span>💬 {post.post_comments.length} комментариев</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/blog/${post.slug}`}>
                    <Button variant="outline" size="sm">
                      Просмотр
                    </Button>
                  </Link>
                  <Link href={`/dashboard/blog/edit/${post.id}`}>
                    <Button size="sm">
                      Редактировать
                    </Button>
                  </Link>
                  {post.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => updatePostStatus(post.id, 'published')}
                      style={{ background: '#4caf50' }}
                    >
                      Опубликовать
                    </Button>
                  )}
                  {post.status === 'published' && (
                    <Button
                      size="sm"
                      onClick={() => updatePostStatus(post.id, 'draft')}
                      style={{ background: '#ff9800' }}
                    >
                      Снять с публикации
                    </Button>
                  )}
                  {(userRole === 'manager' || userRole === 'supervisor' || userRole === 'admin') && (
                    <Button
                      size="sm"
                      onClick={() => deletePost(post.id)}
                      style={{ background: '#f44336' }}
                    >
                      Удалить
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>Статей пока нет</h3>
          <p>Создайте первую статью для вашего блога</p>
          <Button onClick={() => setShowCreateForm(true)}>
            Создать статью
          </Button>
        </div>
      )}
    </div>
  );
}
