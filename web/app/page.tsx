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
            <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-accent)' }}>Уездный кондитер</h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: '#666' }}>
              Свежие торты и десерты с любовью. Создайте торт своей мечты в нашем конструкторе.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <Link className="btn" href="/constructor" style={{ fontSize: 16, padding: '12px 24px' }}>
                Создать торт
              </Link>
              <Link className="btn--outline" href="/catalog" style={{ fontSize: 16, padding: '12px 24px' }}>
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
              ) : null}
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.2}>
        <section style={{ marginTop: 40 }}>
          <h2>Хиты продаж</h2>
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
                    style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                  />
                  <h3 style={{ margin: '12px 0 8px 0' }}>{p.name}</h3>
                  <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-accent)' }}>
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
        <section style={{ marginTop: 40, padding: 32, background: 'var(--color-cream)', borderRadius: 12 }}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: 'var(--color-accent)', marginBottom: 12 }}>Создай свой торт</h2>
              <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 20 }}>
                Выберите событие, начинки, форму и декор — оформим заказ, как только получим ваш эскиз.
              </p>
              <Link className="btn" href="/constructor" style={{ fontSize: 16, padding: '12px 24px' }}>
                Открыть конструктор
              </Link>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 200,
                height: 200,
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-mint))',
                borderRadius: '50%',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 60
              }}>
                🎂
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.6}>
        <section style={{ marginTop: 40 }}>
          <h2>Отзывы наших клиентов</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⭐⭐⭐⭐⭐</div>
              <p>"Самые вкусные торты в городе! Заказывали на свадьбу — все гости в восторге!"</p>
              <div style={{ fontWeight: 600, marginTop: 12 }}>Анна</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⭐⭐⭐⭐⭐</div>
              <p>"Конструктор тортов — гениальная штука! Сделали торт точно как хотели."</p>
              <div style={{ fontWeight: 600, marginTop: 12 }}>Максим</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⭐⭐⭐⭐⭐</div>
              <p>"Отличный сервис, быстрая доставка и безумно вкусно!"</p>
              <div style={{ fontWeight: 600, marginTop: 12 }}>Екатерина</div>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.8}>
        <section style={{ marginTop: 40 }}>
          <h2>Акции и спецпредложения</h2>
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
