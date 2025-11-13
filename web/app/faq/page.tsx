import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import FAQItem from '@/components/faq/FAQItem';
import FadeIn from '@/components/animations/FadeIn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { FaqItem } from '@/types/blog';

export const metadata = {
  title: 'FAQ - Часто задаваемые вопросы',
  description: 'Ответы на самые частые вопросы о наших товарах и услугах'
};

export default async function FAQPage() {
  const supabase = createServerComponentClient({ cookies });

  const { data: faqItems } = await supabase
    .from('faq_items')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('order_index', { ascending: true });

  // Группируем FAQ по категориям
  const faqByCategory = faqItems?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FaqItem[]>) || {};

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'general': return 'Общие вопросы';
      case 'delivery': return 'Доставка';
      case 'products': return 'Товары и услуги';
      case 'payment': return 'Оплата';
      case 'custom': return 'Индивидуальные заказы';
      default: return category;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return '❓';
      case 'delivery': return '🚚';
      case 'products': return '🍰';
      case 'payment': return '💳';
      case 'custom': return '🎨';
      default: return '❓';
    }
  };

  return (
    <FadeIn>
      <div className="mb-4">
        <h1>Часто задаваемые вопросы</h1>
        <p>Здесь вы найдете ответы на самые популярные вопросы о наших товарах и услугах</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* FAQ по категориям */}
        <div className="space-y-4">
          {Object.entries(faqByCategory).map(([category, items]) => (
            <FadeIn key={category}>
              <Card>
                <CardHeader>
                  <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{getCategoryIcon(category)}</span>
                    {getCategoryTitle(category)}
                    <span className="badge">{items.length}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <FAQItem key={item.id} item={item} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>

        {/* Боковая панель */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Не нашли ответ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ marginBottom: '12px' }}>
                Свяжитесь с нами, и мы поможем вам!
              </p>
              <div className="space-y-2">
                <a href="tel:+79990000000" className="btn" style={{ width: '100%', textAlign: 'center' }}>
                  📞 Позвонить
                </a>
                <a href="mailto:hello@konditer.ru" className="btn--outline" style={{ width: '100%', textAlign: 'center' }}>
                  ✉️ Написать
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Популярные вопросы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {faqItems?.slice(0, 5).map((item) => (
                  <a
                    key={item.id}
                    href={`#faq-${item.id}`}
                    style={{
                      display: 'block',
                      padding: '8px',
                      color: 'var(--color-accent)',
                      textDecoration: 'none',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-cream)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {item.question}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Категории</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(faqByCategory).map(([category, items]) => (
                  <a
                    key={category}
                    href={`#category-${category}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      color: 'var(--text)',
                      textDecoration: 'none',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-cream)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>{getCategoryTitle(category)}</span>
                    <span className="badge">{items.length}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FadeIn>
  );
}

// client-side FAQ item component is provided by `components/faq/FAQItem.tsx`
