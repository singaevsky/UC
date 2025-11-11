'use client';

import { useState } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import FadeIn from '@/components/animations/FadeIn';
import FormSelector from '@/components/constructor/FormSelector';
import ToppingSelector from '@/components/constructor/ToppingSelector';
import ColorSelector from '@/components/constructor/ColorSelector';
import Preview from '@/components/constructor/Preview';
// file: app/constructor/page.tsx (фрагмент)
import { useState, useEffect } from 'react';
import { calculatePrice } from '@/shared/lib/price/priceCalculator';

export default function ConstructorPage() {
  const [config, setConfig] = useState({});
  const [price, setPrice] = useState(0);

  // Синхронизация с сервером
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config }),
        });
        const data = await res.json();
        if (res.ok) setPrice(data.price);
        else console.error('Server price calc failed:', data.error);
      } catch (e) {
        console.error('Network error', e);
      }
    };

    fetchPrice();
  }, [config]);

  // Клиентский расчёт как фолбэк
  const clientPrice = calculatePrice(config);
  const displayedPrice = price || clientPrice;

  return (
    <div className="price-widget">
      <p>Расчётная цена: {displayedPrice} ₽</p>
    </div>
  );
}

const eventOptions = [
  { value: 'wedding', label: 'Свадьба' },
  { value: 'birthday', label: 'День рождения' },
  { value: 'corporate', label: 'Корпоратив' },
  { value: 'anniversary', label: 'Годовщина' },
  { value: 'kids', label: 'Детский праздник' },
  { value: 'other', label: 'Другое' }
];

const cakeTypes = [
  { value: 'tort', label: 'Торт' },
  { value: 'dessert', label: 'Десерт' },
  { value: 'keks', label: 'Кекс' }
];

const fillingOptions = ['Клубника', 'Шоколад', 'Птичье молоко', 'Мята', 'Манго', 'Карамель'];

export default function ConstructorPage() {
  const supabase = getClient();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    event: 'birthday',
    cakeType: 'tort',
    form: 'round',
    layers: 1,
    weight: 1.5,
    fillings: [] as string[],
    topping: 'fondant',
    colors: [] as string[],
    date: '',
    comments: '',
    name: ''
  });

  const steps = [
    'Событие',
    'Тип',
    'Форма',
    'Вес/порции',
    'Начинки',
    'Ярусы',
    'Покрытие',
    'Цвет',
    'Дата и имя',
    'Комментарий'
  ];

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const calculatePrice = () => {
    let basePrice = form.cakeType === 'tort' ? 1800 : 1200;
    basePrice += (form.layers - 1) * 300;
    basePrice += form.fillings.length * 150;
    return Math.round(basePrice * form.weight);
  };

  async function submit() {
    const payload = {
      product_id: null, // Индивидуальный торт
      quantity: 1,
      options: { ...form, price: calculatePrice() }
    };

    const { error } = await supabase.from('cart_items').insert({
      product_id: null,
      quantity: 1,
      options: payload.options
    });

    if (error) {
      alert('Ошибка добавления в корзину: ' + error.message);
      return;
    }

    router.push('/cart');
  }

  const toggleFilling = (filling: string) => {
    if (form.fillings.includes(filling)) {
      setForm({ ...form, fillings: form.fillings.filter(f => f !== filling) });
    } else if (form.fillings.length < 3) {
      setForm({ ...form, fillings: [...form.fillings, filling] });
    }
  };

  return (
    <FadeIn>
      <div>
        <h1>Конструктор тортов</h1>

        {/* Прогресс-бар */}
        <div style={{ margin: '20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            {steps.map((step, i) => (
              <div key={i} style={{
                fontSize: '12px',
                color: i === currentStep ? 'var(--color-accent)' :
                       i < currentStep ? 'var(--color-gold)' : '#999'
              }}>
                {step}
              </div>
            ))}
          </div>
          <div style={{ height: '4px', background: '#eee', borderRadius: '2px' }}>
            <div
              style={{
                height: '100%',
                background: 'var(--color-accent)',
                borderRadius: '2px',
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div className="card">
            {/* Шаг 1: Событие */}
            {currentStep === 0 && (
              <div>
                <h3>Событие</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
                  {eventOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setForm({ ...form, event: option.value })}
                      style={{
                        padding: 16,
                        border: form.event === option.value ? '2px solid var(--color-accent)' : '1px solid #ddd',
                        borderRadius: 8,
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Шаг 2: Тип */}
            {currentStep === 1 && (
              <div>
                <h3>Тип изделия</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
                  {cakeTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setForm({ ...form, cakeType: type.value })}
                      style={{
                        padding: 16,
                        border: form.cakeType === type.value ? '2px solid var(--color-accent)' : '1px solid #ddd',
                        borderRadius: 8,
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Шаг 3: Форма */}
            {currentStep === 2 && (
              <FormSelector
                selected={form.form}
                onChange={(formType) => setForm({ ...form, form: formType })}
              />
            )}

            {/* Шаг 4: Вес/порции */}
            {currentStep === 3 && (
              <div>
                <h3>Вес/количество порций</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                  <div>
                    <label>Вес (кг)</label>
                    <input
                      className="input"
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="10"
                      value={form.weight}
                      onChange={e => setForm({ ...form, weight: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label>Примерно порций</label>
                    <input
                      className="input"
                      type="number"
                      value={Math.round(form.weight * 6)}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Шаг 5: Начинки */}
            {currentStep === 4 && (
              <div>
                <h3>Начинки (до 3-х)</h3>
                <p style={{ color: '#666', marginBottom: 12 }}>
                  Выбрано: {form.fillings.length}/3
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {fillingOptions.map(filling => (
                    <button
                      key={filling}
                      onClick={() => toggleFilling(filling)}
                      style={{
                        padding: 12,
                        border: form.fillings.includes(filling) ? '2px solid var(--color-accent)' : '1px solid #ddd',
                        borderRadius: 8,
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      {filling}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Шаг 6: Ярусы */}
            {currentStep === 5 && (
              <div>
                <h3>Количество ярусов</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
                  {[1, 2, 3, 4].map(layers => (
                    <button
                      key={layers}
                      onClick={() => setForm({ ...form, layers })}
                      style={{
                        padding: 16,
                        border: form.layers === layers ? '2px solid var(--color-accent)' : '1px solid #ddd',
                        borderRadius: 8,
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      {layers} {layers === 1 ? 'ярус' : layers < 5 ? 'яруса' : 'ярусов'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Шаг 7: Покрытие */}
            {currentStep === 6 && (
              <ToppingSelector
                selected={form.topping}
                onChange={(topping) => setForm({ ...form, topping })}
              />
            )}

            {/* Шаг 8: Цвет */}
            {currentStep === 7 && (
              <ColorSelector
                selected={form.colors}
                onChange={(colors) => setForm({ ...form, colors })}
              />
            )}

            {/* Шаг 9: Дата и имя */}
            {currentStep === 8 && (
              <div>
                <h3>Дата события и имя</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                  <div>
                    <label>Дата события</label>
                    <input
                      className="input"
                      type="date"
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Имя или надпись</label>
                    <input
                      className="input"
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Например: Анна 25 лет"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Шаг 10: Комментарий */}
            {currentStep === 9 && (
              <div>
                <h3>Комментарий к заказу</h3>
                <textarea
                  className="input"
                  rows={4}
                  value={form.comments}
                  onChange={e => setForm({ ...form, comments: e.target.value })}
                  placeholder="Опишите дополнительные пожелания к торту..."
                />
              </div>
            )}

            {/* Навигация */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button
                className="btn--outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Назад
              </button>

              {currentStep < steps.length - 1 ? (
                <button className="btn" onClick={nextStep}>
                  Далее
                </button>
              ) : (
                <button className="btn" onClick={submit}>
                  Добавить в корзину — {calculatePrice()} ₽
                </button>
              )}
            </div>
          </div>

          {/* Предпросмотр */}
          <div>
            <Preview
              form={form.form}
              layers={form.layers}
              topping={form.topping}
              colors={form.colors}
              fillings={form.fillings}
            />
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
