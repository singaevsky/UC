import FadeIn from '@/components/animations/FadeIn';
import Image from 'next/image';

export const metadata = {
  title: 'О нас - Уездный кондитер',
  description: 'История, команда и ценности кондитерской Уездный кондитер'
};

export default function AboutPage() {
  return (
    <FadeIn>
      <div className="max-w-4xl mx-auto">
        <h1>О нас</h1>

        <FadeIn delay={0.2}>
          <div className="card" style={{ marginTop: 16 }}>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <h2>Наша история</h2>
                <p>«Уездный кондитер» начался с простой мечты — создавать торты, которые приносят радость. Основанная в 2018 году, наша кондитерская быстро завоевала любовь горожан.</p>
                <p>Мы используем только натуральные ингредиенты и следим за каждым этапом производства. Наша команда — это профессиональные кондитеры с многолетним опытом.</p>
              </div>
              <div>
                <Image
                  src="/images/about/story.jpg"
                  alt="История кондитерской"
                  width={400}
                  height={300}
                  style={{ width: '100%', height: 'auto', borderRadius: 8 }}
                />
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="card" style={{ marginTop: 16 }}>
            <h2>Наша команда</h2>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
              {[
                { name: 'Анна Петрова', role: 'Главный кондитер', image: '/images/team/anna.jpg' },
                { name: 'Елена Сидорова', role: 'Шеф-декоратор', image: '/images/team/elena.jpg' },
                { name: 'Михаил Иванов', role: 'Менеджер заказов', image: '/images/team/mikhail.jpg' }
              ].map((member, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={200}
                    height={200}
                    style={{ width: '100%', height: 'auto', borderRadius: '50%', marginBottom: 8 }}
                  />
                  <h4 style={{ margin: '4px 0' }}>{member.name}</h4>
                  <p style={{ color: '#666', margin: 0 }}>{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.6}>
          <div className="card" style={{ marginTop: 16 }}>
            <h2>Наши ценности</h2>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { title: 'Качество', desc: 'Только лучшие ингредиенты', icon: '🏆' },
                { title: 'Инновации', desc: 'Современные технологии и вкусы', icon: '💡' },
                { title: 'Забота', desc: 'Относимся к каждому заказу как к особенному', icon: '❤️' }
              ].map((value, index) => (
                <div key={index} style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>{value.icon}</div>
                  <h3 style={{ margin: '8px 0' }}>{value.title}</h3>
                  <p style={{ color: '#666' }}>{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.8}>
          <div className="card" style={{ marginTop: 16 }}>
            <h2>Сертификаты и награды</h2>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {['/images/certificates/cert1.jpg', '/images/certificates/cert2.jpg', '/images/certificates/award1.jpg', '/images/certificates/award2.jpg'].map((img, i) => (
                <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
                  <Image src={img} alt={`Сертификат ${i+1}`} width={200} height={150} />
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </FadeIn>
  );
}
