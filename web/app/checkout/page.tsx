'use client';

import { useState, useEffect } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { PriceCalculator } from '@/lib/price-calculator';
import FadeIn from '@/components/animations/FadeIn';

type Address = {
  city: string;
  street: string;
  house: string;
  flat?: string;
};

export default function CheckoutPage() {
  const supabase = getClient();
  const router = useRouter();

  const [deliveryMethod, setDeliveryMethod] = useState<'pickup'|'courier'|'sdek'>('pickup');
  const [address, setAddress] = useState<Address>({ city: '', street: '', house: '', flat: '' });
  const [paymentMethod, setPaymentMethod] = useState<'card'|'sberbank'|'tinkoff'|'yookassa'>('yookassa');
  const [comment, setComment] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('cart_items').select('*, products(name, price)');
      setCart(data || []);
      const cartTotal = (data || []).reduce((s, i) => s + (i.products?.price ?? 0) * i.quantity, 0);
      setTotal(cartTotal);
    })();
  }, []);

  useEffect(() => {
    // Расчет доставки
    const delivery = PriceCalculator.calculateDeliveryPrice(deliveryMethod, 5, 1);
    setDeliveryPrice(delivery);
  }, [deliveryMethod]);

  async function applyPromo() {
    if (!promoCode) return;

    const response = await fetch('/api/promos/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: promoCode })
    });

    const result = await response.json();
    if (result.discount_percent) {
      setPromoDiscount(result.discount_percent);
      alert(`Промокод применен! Скидка ${result.discount_percent}%`);
    } else if (result.discount_amount) {
      setPromoDiscount(result.discount_amount);
      alert(`Промокод применен! Скидка ${result.discount_amount} ₽`);
    } else {
      alert(result.error || 'Недействительный промокод');
    }
  }

  async function placeOrder() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      alert('Войдите, чтобы оформить заказ');
      setLoading(false);
      return;
    }

    const payload = {
      delivery_method: deliveryMethod,
      delivery_price: deliveryPrice,
      address: deliveryMethod !== 'pickup' ? address : null,
      payment_method: paymentMethod,
      comments: comment,
      promo_code: promoCode,
      items: cart.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        price: i.products?.price,
        name_snapshot: i.products?.name
      }))
    };

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      alert('Ошибка оформления заказа');
      setLoading(false);
      return;
    }

    const order = await res.json();

    if (paymentMethod === 'yookassa') {
      const pr = await fetch('/api/payments/yookassa/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          amount: order.total,
          description: `Заказ #${order.id}`
        })
      });
      const payment = await pr.json();
      if (payment?.confirmation?.confirmation_url) {
        location.href = payment.confirmation.confirmation_url;
      } else {
        router.push('/cart');
      }
    } else {
      router.push('/account');
    }

    setLoading(false);
  }

  const finalTotal = promoDiscount
    ? PriceCalculator.applyDiscount(total + deliveryPrice, { percent: promoDiscount })
    : total + deliveryPrice;

  return (
    <FadeIn>
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div>
          <div className="card">
            <h2>Доставка</h2>
            <select
              value={deliveryMethod}
              onChange={e => setDeliveryMethod(e.target.value as any)}
              className="mb-2"
            >
              <option value="pickup">Самовывоз</option>
              <option value="courier">Курьер</option>
              <option value="sdek">СДЭК</option>
            </select>

            {deliveryMethod !== 'pickup' && (
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                <div>
                  <label>Город</label>
                  <input className="input" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} />
                </div>
                <div>
                  <label>Улица</label>
                  <input className="input" value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} />
                </div>
                <div>
                  <label>Дом</label>
                  <input className="input" value={address.house} onChange={e => setAddress({ ...address, house: e.target.value })} />
                </div>
                <div>
                  <label>Квартира</label>
                  <input className="input" value={address.flat} onChange={e => setAddress({ ...address, flat: e.target.value })} />
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h2>Оплата</h2>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
              <option value="yookassa">Банковская карта (ЮKassa)</option>
              <option value="sberbank">Сбербанк</option>
              <option value="tinkoff">Тинькофф</option>
            </select>
          </div>

          <div className="card">
            <h2>Комментарий</h2>
            <textarea
              className="input"
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Дополнительные пожелания к заказу..."
            />
          </div>

          <div className="card">
            <h2>Промокод</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="input"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Введите промокод"
              />
              <button className="btn--outline" onClick={applyPromo}>Применить</button>
            </div>
            {promoDiscount && (
              <p style={{ color: 'green', marginTop: '8px' }}>
                Скидка применена: {promoDiscount}%
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <h2>Итого</h2>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Товары:</span>
              <span>{total.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Доставка:</span>
              <span>{deliveryPrice.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}</span>
            </div>
            {promoDiscount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green' }}>
                <span>Скидка ({promoDiscount}%):</span>
                <span>-{Math.round((total + deliveryPrice) * promoDiscount / 100).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}</span>
              </div>
            )}
            <hr style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 700 }}>
              <span>К оплате:</span>
              <span>{finalTotal.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}</span>
            </div>
          </div>

          <button
            className="btn"
            onClick={placeOrder}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Оформляем...' : 'Оформить заказ'}
          </button>
        </div>
      </div>
    </FadeIn>
  );
}
