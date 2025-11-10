import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import FadeIn from '@/components/animations/FadeIn';

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: banners } = await supabase.from('banners').select('*').eq('active', true).order('sort_order');
  const { data: products } = await supabase.from('products').select('*').eq('active', true).limit(8);
  const { data: promotions } = await supabase.from('promotions').select('*').eq('active', true);

  return (
    <div>
      <FadeIn>
        <section className="grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'center' }}>
          <div style={{ gridColumn: 'span 7' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-accent)', marginBottom: '16px' }}>
              Уездный кондитер
            </h1>
            <p style={{ fontSize: '18px', lineHeight: 1.6, color: '#666', marginBottom: '20px' }}>
              Свежие торты и десерты с любовью. Создайте торт своей мечты в нашем конструкторе.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <Link className="btn" href="/constructor" style={{ fontSize: '16px', padding: '12px 24px' }}>
                Создать торт
              </Link>
              <Link className="btn--outline" href="/catalog" style={{ fontSize: '16px', padding: '12px 24px' }}>
                В каталог
              </Link>
            </div>
          </div>
          <div style={{ gridColumn: 'span 5' }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              {banners?.[0] ? (
                <Image
                  src={banners[0].image_url}
                  alt={banners[0].title}
                  width={640}
                  height={360}
                  style={{ width: '100%', height: 'auto' }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '300px',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-mint))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  fontSize: '48px'
                }}>
                  🎂
                </div>
              )}
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.2}>
        <section style={{ marginTop: '40px' }}>
          <h2 style={{ marginBottom: '24px' }}>Хиты продаж</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {products?.map((p, index) => (
              <FadeIn key={p.id} delay={index * 0.1}>
                <div className="card" style={{ transition: 'transform 0.3s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <Image
                    src={p.images?.[0] ?? '/images/placeholder.jpg'}
                    alt={p.name}
                    width={300}
                    height={200}
                    style={{ width: '100%', height: 'auto', borderRadius: '8px', marginBottom: '12px' }}
                  />
                  <h3 style={{ margin: '0 0 8px 0' }}>{p.name}</h3>
                  <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '12px' }}>
                    {formatPrice(p.price)}
                  </p>
                  <Link
                    className="btn"
                    href={`/product/${p.slug}`}
                    style={{ width: '100%', textAlign: 'center' }}
                  >
                    Подробнее
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.4}>
        <section style={{ marginTop: '40px', padding: '32px', background: 'var(--color-cream)', borderRadius: '12px' }}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>Создай свой торт</h2>
              <p style={{ fontSize: '16px', lineHeight: 1.6, marginBottom: '20px' }}>
                Выберите событие, начинки, форму и декор — оформим заказ, как только получим ваш эскиз.
              </p>
              <Link className="btn" href="/constructor" style={{ fontSize: '16px', padding: '12px 24px' }}>
                Открыть конструктор
              </Link>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '200px',
                height: '200px',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-mint))',
                borderRadius: '50%',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '60px'
              }}>
                🎂
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.6}>
        <section style={{ marginTop: '40px' }}>
          <h2 style={{ marginBottom: '24px' }}>Отзывы наших клиентов</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⭐⭐⭐⭐⭐</div>
              <p>"Самые вкусные торты в городе! Заказывали на свадьбу — все гости в восторге!"</p>
              <div style={{ fontWeight: 600, marginTop: '12px' }}>Анна</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⭐⭐⭐⭐⭐</div>
              <p>"Конструктор тортов — гениальная штука! Сделали торт точно как хотели."</p>
              <div style={{ fontWeight: 600, marginTop: '12px' }}>Максим</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⭐⭐⭐⭐⭐</div>
              <p>"Отличный сервис, быстрая доставка и безумно вкусно!"</p>
              <div style={{ fontWeight: 600, marginTop: '12px' }}>Екатерина</div>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.8}>
        <section style={{ marginTop: '40px' }}>
          <h2 style={{ marginBottom: '24px' }}>Акции и спецпредложения</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {promotions?.slice(0, 2).map(promo => (
              <div key={promo.id} className="card" style={{
                background: 'linear-gradient(135deg, var(--color-gold), #f4d03f)',
                color: 'white'
              }}>
                <h3 style={{ margin: '0 0 8px 0' }}>{promo.name}</h3>
                <p style={{ margin: '0 0 12px 0' }}>{promo.description}</p>
                {promo.promo_code && (
                  <div className="badge" style={{ background: 'rgba(255,255,255,0.3)' }}>
                    Промокод: {promo.promo_code}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
