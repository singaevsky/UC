'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getClient } from '@/lib/supabase/client';
import FadeIn from '@/components/animations/FadeIn';

export default function EditProduct() {
  const params = useParams();
  const router = useRouter();
  const supabase = getClient();
  const [form, setForm] = useState({
    name: '',
    slug: '',
    category_id: 0,
    description: '',
    price: 0,
    base_weight: 1,
    event_types: [] as string[],
    filling_ids: [] as number[],
    images: [] as string[],
    active: true
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [fillings, setFillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: product } = await supabase.from('products').select('*').eq('id', params.id).single();
      const { data: cats } = await supabase.from('categories').select('*');
      const { data: fills } = await supabase.from('fillings').select('*');

      if (product) setForm(product);
      setCategories(cats || []);
      setFillings(fills || []);
      setLoading(false);
    })();
  }, [params.id]);

  const save = async () => {
    const { error } = await supabase.from('products').update(form).eq('id', params.id);
    if (!error) {
      alert('Сохранено!');
      router.push('/admin/products');
    } else {
      alert('Ошибка: ' + error.message);
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <FadeIn>
      <div>
        <h1>Редактирование товара</h1>
        <div className="card" style={{ maxWidth: 800 }}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div>
              <label>Название</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label>Slug</label>
              <input className="input" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div>
              <label>Категория</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: Number(e.target.value) })}>
                <option value={0}>Выберите категорию</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Цена</label>
              <input className="input" type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div>
              <label>Вес</label>
              <input className="input" type="number" step="0.1" value={form.base_weight} onChange={e => setForm({ ...form, base_weight: Number(e.target.value) })} />
            </div>
            <div>
              <label>Статус</label>
              <select value={form.active ? '1' : '0'} onChange={e => setForm({ ...form, active: e.target.value === '1' })}>
                <option value="1">Активен</option>
                <option value="0">Скрыт</option>
              </select>
            </div>
          </div>

          <div>
            <label>Описание</label>
            <textarea className="input" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <label>События</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['wedding','birthday','corporate','anniversary','kids','other'].map(event => (
                <label key={event} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={form.event_types.includes(event)}
                    onChange={e => {
                      const types = e.target.checked
                        ? [...form.event_types, event]
                        : form.event_types.filter(t => t !== event);
                      setForm({ ...form, event_types: types });
                    }}
                  />
                  {event}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label>Начинки</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {fillings.map(f => (
                <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={form.filling_ids.includes(f.id)}
                    onChange={e => {
                      const ids = e.target.checked
                        ? [...form.filling_ids, f.id]
                        : form.filling_ids.filter(id => id !== f.id);
                      setForm({ ...form, filling_ids: ids });
                    }}
                  />
                  {f.name}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className="btn" onClick={save}>Сохранить</button>
            <button className="btn--outline" onClick={() => router.back()}>Отмена</button>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
