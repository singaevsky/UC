import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Image from 'next/image';
import AddToCart from './add-to-cart.client';
import { formatPrice } from '@/lib/utils';

export default async function ProductPage({ params }: { params: { slug: string }}) {
  const supabase = createServerComponentClient({ cookies });
  const { data: product } = await supabase.from('products').select('*').eq('slug', params.slug).single();
  if (!product) return <div>Товар не найден</div>;

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
      <div>
        <Image src={product.images?.[0] ?? '/images/placeholder.jpg'} alt={product.name} width={640} height={480} />
      </div>
      <div>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <p style={{ fontSize: 24, fontWeight: 700 }}>{formatPrice(product.price)}</p>
        <AddToCart productId={product.id} />
      </div>
    </div>
  );
}
