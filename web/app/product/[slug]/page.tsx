import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import CartButton from '@/components/CartButton';
import FadeIn from '@/components/animations/FadeIn';

export default async function ProductPage({ params }: { params: { slug: string }}) {
  const supabase = createServerComponentClient({ cookies });
  const { data: product } = await supabase.from('products').select('*').eq('slug', params.slug).single();
  const { data: reviews } = await supabase.from('reviews').select('*').eq('product_id', product?.id).eq('status', 'published');

  if (!product) return <div className="card">Товар не найден</div>;

  const averageRating = reviews?.length ?
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <FadeIn>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <div className="card">
            <Image
              src={product.images?.[0] ?? '/images/placeholder.jpg'}
              alt={product.name}
              width={640}
              height={480}
              style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
            />
            {product.images && product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {product.images.slice(1).map((img, i) => (
                  <Image key={i} src={img} alt={`${product.name} ${i+2}`} width={80} height={60} style={{ borderRadius: '4px' }} />
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <h1>{product.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
            <div>⭐ {averageRating.toFixed(1)}</div>
            <div style={{ color: '#666' }}>({reviews?.length || 0} отзывов)</div>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-accent)', margin: '16px 0' }}>
            {formatPrice(product.price)}
          </p>
          <p style={{ lineHeight: 1.6, marginBottom: '16px' }}>{product.description}</p>

          <div className="mb-3">
            <strong>Вес:</strong> {product.base_weight} кг
          </div>

          <div className="mb-3">
            <strong>Подходит для событий:</strong>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              {product.event_types.map((event) => (
                <span key={event} className="badge">{event}</span>
              ))}
            </div>
          </div>

          <CartButton
            productId={product.id}
            productName={product.name}
            price={product.price}
            style={{ width: '100%', marginBottom: '16px' }}
          />
        </div>
      </div>

      {reviews && reviews.length > 0 && (
        <div className="mt-4">
          <h2>Отзывы</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {reviews.map((review) => (
              <div key={review.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div>⭐ {review.rating}</div>
                  <div style={{ color: '#666' }}>{new Date(review.created_at).toLocaleDateString()}</div>
                </div>
                <p>{review.text}</p>
                {review.image_url && (
                  <Image src={review.image_url} alt="Отзыв" width={200} height={150} style={{ marginTop: '8px', borderRadius: '4px' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </FadeIn>
  );
}
