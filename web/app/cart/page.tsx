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
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div>
          {items?.map((i) => (
            <div key={i.id} className="card" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <Image
                src={i.products?.images?.[0] ?? '/images/placeholder.jpg'}
                alt={i.products?.name ?? ''}
                width={120}
                height={90}
                style={{ borderRadius: '8px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{i.products?.name}</div>
                <div>{formatPrice((i.products?.price ?? 0) * i.quantity)}</div>
                <div>Количество: {i.quantity}</div>
              </div>
              <RemoveFromCart id={i.id} />
            </div>
          )) ?? <div className="card">Корзина пуста</div>}
        </div>
        <div className="card">
          <h3>Итого</h3>
          <p style={{ fontSize: '24px', fontWeight: 800 }}>{formatPrice(total)}</p>
          <Link className="btn" href="/checkout" style={{ width: '100%', textAlign: 'center' }}>
            Оформить заказ
          </Link>
        </div>
      </div>
    </div>
  );
}
