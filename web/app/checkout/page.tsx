// file: app/checkout/page.tsx
'use client';
import { useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { AddressForm } from '@/components/checkout/AddressForm';

export default function CheckoutPage() {
  const { user } = useUser();
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'courier' | 'sdek'>('pickup');
  const [validAddress, setValidAddress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        userId: user?.id,
        delivery_type: deliveryType,
      };
      if (deliveryType === 'courier') payload.delivery_address = validAddress?.address;
      if (deliveryType === 'sdek') payload.delivery_pickup_point_id = validAddress?.pickupId;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка оформления заказа');
      window.location.href = `/order-confirmation/${data.order.id}`;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Оформление заказа</h1>
      <div className="space-y-4">
        <div>
          <label className="block mb-1">Способ доставки</label>
          <select
            className="border p-2 rounded w-full"
            value={deliveryType}
            onChange={(e) => setDeliveryType(e.target.value as any)}
          >
            <option value="pickup">Самовывоз</option>
            <option value="courier">Курьер</option>
            <option value="sdek">Пункт выдачи СДЭК</option>
          </select>
        </div>

        {deliveryType === 'courier' && (
          <AddressForm
            onValid={(address) => setValidAddress({ address })}
          />
        )}

        {deliveryType === 'sdek' && (
          <div>
            <label className="block mb-1">ID пункта выдачи СДЭК</label>
            <input
              className="border p-2 rounded w-full"
              placeholder="UUID пункта"
              onChange={(e) => setValidAddress({ pickupId: e.target.value })}
            />
          </div>
        )}

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleCreateOrder}
          disabled={loading}
        >
          {loading ? 'Оформляем…' : 'Подтвердить заказ'}
        </button>

        {error && <p className="text-red-600">{error}</p>}
      </div>
    </div>
  );
}
