import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function AdminPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>Нужна авторизация</div>;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin') return <div>Доступ запрещён</div>;

  const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });

  return (
    <div>
      <h1>Админ-панель</h1>
      <h2>Товары</h2>
      {(products ?? []).map(p => (
        <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>{p.name} — {p.active ? 'Активен' : 'Скрыт'}</div>
          <Link className="btn--outline" href={`/admin/product/${p.id}`}>Редактировать</Link>
        </div>
      ))}
      <h2 style={{ marginTop: 16 }}>Заказы</h2>
      {(orders ?? []).map(o => (
        <div key={o.id} className="card">#{o.id} — {o.status} — {o.total} ₽</div>
      ))}
    </div>
  );
}
