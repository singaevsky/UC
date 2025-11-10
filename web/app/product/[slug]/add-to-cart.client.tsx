'use client';

import { useState } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AddToCart({ productId }: { productId: number }) {
  const supabase = getClient();
  const [qty, setQty] = useState(1);
  const router = useRouter();

  async function add() {
    await supabase.from('cart_items').insert({ product_id: productId, quantity: qty, options: {} });
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input className="input" type="number" value={qty} min={1} onChange={e => setQty(parseInt(e.target.value || '1'))} style={{ width: 100 }} />
      <button className="btn" onClick={add}>В корзину</button>
    </div>
  );
}
