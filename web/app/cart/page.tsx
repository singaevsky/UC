import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import RemoveFromCart from './remove.client';

export default async function CartPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: items } = await supabase.from('cart_items').select('*, products(name, images, price)').order('created_at', { ascending: false });

  const total = items?.reduce((sum, i) => sum + (i.products?.price ?? 0) * i.quantity, 0) ?? 0;

  return (
    <div>
      <h1>Корзина</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div>
          {items?.map((i) => (
            <div key={i.id} className="card" style={{ display: 'flex', gap: 12 }}>
              <Image src={i.products?.images?.[0] ?? '/images/placeholder.jpg'} alt={i.products?.name ?? ''} width={120} height={90} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{i.products?.name}</div>
                <div>{formatPrice((i.products?.price ?? 0) * i.quantity)}</div>
                <div>Кол-во: {i.quantity}</div>
              </div>
              <RemoveFromCart id={i.id} />
            </div>
          )) ?? <p>Корзина пуста</p>}
        </div>
        <div className="card">
          <h3>Итого</h3>
          <p style={{ fontWeight: 800 }}>{formatPrice(total)}</p>
          <Link className="btn" href="/checkout">Оформить заказ</Link>
        </div>
      </div>
    </div>
  );
}
