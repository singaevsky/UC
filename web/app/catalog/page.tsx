import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';

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

  return (
    <div>
      <h1>Каталог</h1>
      <Filters />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {products?.map((p) => (
          <div key={p.id} className="card">
            <Image src={p.images?.[0] ?? '/images/placeholder.jpg'} alt={p.name} width={300} height={200} />
            <h3>{p.name}</h3>
            <p>{formatPrice(p.price)}</p>
            <Link className="btn" href={`/product/${p.slug}`}>В корзину</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function Filters() {
  return (
    <form method="get" className="card" style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
      <input className="input" name="q" placeholder="Поиск..." />
      <input className="input" name="min" placeholder="Цена от" type="number" />
      <input className="input" name="max" placeholder="Цена до" type="number" />
      <select name="event">
        <option value="">Событие</option>
        <option value="wedding">Свадьба</option>
        <option value="birthday">День рождения</option>
        <option value="corporate">Корпоратив</option>
        <option value="anniversary">Годовщина</option>
        <option value="kids">Детский</option>
        <option value="other">Другое</option>
      </select>
      <button className="btn" type="submit">Фильтровать</button>
    </form>
  );
}
