import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import FadeIn from '@/components/animations/FadeIn';

async function getData(searchParams: Record<string, string | string[] | undefined>) {
  const supabase = createServerComponentClient({ cookies });
  const sp = searchParams;

  let query = supabase.from('products').select('*').eq('active', true);

  if (sp.q) query = query.ilike('name', `%${sp.q}%`);
  if (sp.category) query = query.eq('category_id', Number(sp.category));
  if (sp.filling) query = query.contains('filling_ids', [Number(sp.filling)]);
  if (sp.event) query = query.contains('event_types', [sp.event]);
  if (sp.min) query = query.gte('price', Number(sp.min));
  if (sp.max) query = query.lte('price', Number(sp.max));

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  return { products: data };
}

export default async function CatalogPage({ searchParams }: { searchParams: any }) {
  const { products } = await getData(searchParams);
  const supabase = createServerComponentClient({ cookies });
  const { data: categories } = await supabase.from('categories').select('*');
  const { data: fillings } = await supabase.from('fillings').select('*');

  return (
    <div>
      <FadeIn>
        <h1>Каталог</h1>
        <Filters categories={categories || []} fillings={fillings || []} />
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {products?.map((p) => (
            <FadeIn key={p.id}>
              <div className="card">
                <Image
                  src={p.images?.[0] ?? '/images/placeholder.jpg'}
                  alt={p.name}
                  width={300}
                  height={200}
                  style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                />
                <h3 style={{ margin: '12px 0 8px 0' }}>{p.name}</h3>
                <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-accent)' }}>
                  {formatPrice(p.price)}
                </p>
                <Link className="btn" href={`/product/${p.slug}`} style={{ width: '100%', textAlign: 'center' }}>
                  Подробнее
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </FadeIn>
    </div>
  );
}

function Filters({ categories, fillings }: { categories: any[]; fillings: any[] }) {
  return (
    <form method="get" className="card" style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
      <input className="input" name="q" placeholder="Поиск..." />
      <select name="category">
        <option value="">Категория</option>
        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
      </select>
      <select name="filling">
        <option value="">Начинка</option>
        {fillings.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
      <select name="event">
        <option value="">Событие</option>
        <option value="wedding">Свадьба</option>
        <option value="birthday">День рождения</option>
        <option value="corporate">Корпоратив</option>
        <option value="anniversary">Годовщина</option>
        <option value="kids">Детский</option>
        <option value="other">Другое</option>
      </select>
      <input className="input" name="min" placeholder="Цена от" type="number" />
      <input className="input" name="max" placeholder="Цена до" type="number" />
      <button className="btn" type="submit" style={{ gridColumn: 'span 6' }}>Фильтровать</button>
    </form>
  );
}
