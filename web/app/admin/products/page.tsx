'use client';

import { useState, useEffect } from 'react';
import { getClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminProducts() {
  const supabase = getClient();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: prods } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
      const { data: cats } = await supabase.from('categories').select('*');
      setProducts(prods || []);
      setCategories(cats || []);
      setLoading(false);
    })();
  }, []);

  const toggleActive = async (id: number, current: boolean) => {
    await supabase.from('products').update({ active: !current }).eq('id', id);
    setProducts(products.map(p => p.id === id ? { ...p, active: !current } : p));
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Товары</h1>
        <Link className="btn" href="/admin/products/new">Добавить товар</Link>
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px' }}>ID</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Название</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Категория</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Цена</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Статус</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>{p.id}</td>
                <td style={{ padding: '8px' }}>{p.name}</td>
                <td style={{ padding: '8px' }}>{p.categories?.name}</td>
                <td style={{ padding: '8px' }}>{p.price} ₽</td>
                <td style={{ padding: '8px' }}>
                  <button
                    onClick={() => toggleActive(p.id, p.active)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: p.active ? '#4CAF50' : '#f44336',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {p.active ? 'Активен' : 'Скрыт'}
                  </button>
                </td>
                <td style={{ padding: '8px' }}>
                  <Link className="btn--outline" href={`/admin/products/${p.id}/edit`}>Редактировать</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
