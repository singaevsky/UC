'use client';

import { useState, useEffect } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Address = { city: string; street: string; house: string; flat?: string };

export default function CheckoutPage() {
  const supabase = getClient();
  const router = useRouter();

  const [deliveryMethod, setDeliveryMethod] = useState<'pickup'|'courier'|'sdek'>('pickup');
  const [address, setAddress] = useState<Address>({ city: '', street: '', house: '', flat: '' });
  const [paymentMethod, setPaymentMethod] = useState<'card'|'sberbank'|'tinkoff'|'yookassa'>('yookassa');
  const [comment, setComment] = useState('');

  const [cart, setCart] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('cart_items').select('*, products(name, price)');
      setCart(data ?? []);
      setTotal((data ?? []).reduce((s, i) => s + (i.products?.price ?? 0) * i.quantity, 0));
    })();
  }, []);

  async function placeOrder() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      alert('Войдите, чтобы оформить заказ');
      return;
    }
    const payload = {
      delivery_method: deliveryMethod,
      delivery_price: 0,
      address: deliveryMethod !== 'pickup' ? address : null,
      payment_method: paymentMethod,
      comments: comment,
      items: cart.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        price: i.products?.price,
        name_snapshot: i.products?.name
      }))
    };
    const res = await fetch('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
    if (!res.ok) { alert('Ошибка оформления заказа'); return; }
    const order = await res.json();

    if (order.payment_method === 'yookassa') {
      const pr = await fetch('/api/payments/yookassa', { method: 'POST', body: JSON.stringify({ order_id: order.id, amount: order.total, description: `Заказ #${order.id}` }) });
      const payment = await pr.json();
      if (payment?.confirmation?.confirmation_url) {
        location.href = payment.confirmation.confirmation_url;
      } else {
        router.push('/cart');
      }
    } else {
      router.push('/account');
    }
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
      <div className="card">
        <h2>Доставка</h2>
        <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value as any)}>
          <option value="pickup">Самовывоз</option>
          <option value="courier">Курьер</option>
          <option value="sdek">СДЭК</option>
        </select>
        {deliveryMethod !== 'pickup' && (
          <div style={{ marginTop: 8 }}>
            <label>Город</label>
            <input className="input" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} />
            <label>Улица</label>
            <input className="input" value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} />
            <label>Дом</label>
            <input className="input" value={address.house} onChange={e => setAddress({ ...address, house: e.target.value })} />
            <label>Квартира</label>
            <input className="input" value={address.flat} onChange={e => setAddress({ ...address, flat: e.target.value })} />
          </div>
        )}
        <h2 style={{ marginTop: 16 }}>Оплата</h2>
        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
          <option value="yookassa">Банковская карта (ЮKassa)</option>
          <option value="sberbank">Сбербанк</option>
          <option value="tinkoff">Тинькофф</option>
        </select>
        <h2 style={{ marginTop: 16 }}>Комментарий</h2>
        <textarea className="input" value={comment} onChange={e => setComment(e.target.value)} />
      </div>
      <div className="card">
        <h2>Итого</h2>
        <p>Позиций: {cart.length}</p>
        <p>Сумма: {total.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}</p>
        <button className="btn" onClick={placeOrder}>Оформить заказ</button>
      </div>
    </div>
  );
}
