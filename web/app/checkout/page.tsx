// file: app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { AddressForm } from '@/components/checkout/AddressForm';

type DeliveryType = 'pickup' | 'courier' | 'sdek';

type AddressData = {
  city: string;
  street: string;
  house: string;
  apartment?: string;
};

export default function CheckoutPage() {
  const { user, loading: userLoading } = useUser();

  // ✅ Правильная типизация состояния
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
  const [validAddress, setValidAddress] = useState<AddressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Получаем draftId из URL
  const draftId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('draftId')
    : null;

  // ✅ Валидация пользователя
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Необходима авторизация</h1>
          <p>Войдите в систему для оформления заказа</p>
        </div>
      </div>
    );
  }

  // ✅ Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Валидация перед отправкой
      if (deliveryType === 'courier' && !validAddress) {
        setError('Пожалуйста, укажите корректный адрес доставки');
        setLoading(false);
        return;
      }

      const orderData = {
        userId: user.id,
        delivery_type: deliveryType,
        delivery_address: validAddress ?
          `${validAddress.city}, ${validAddress.street}, д. ${validAddress.house}${validAddress.apartment ? ', кв. ' + validAddress.apartment : ''}` :
          undefined,
        cake_config: {}, // Получим из черновика
        draftId,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка оформления заказа');
      }

      setOrderId(data.order.id);

      // Перенаправляем на страницу подтверждения
      window.location.href = `/order-confirmation/${data.order.id}`;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Оформление заказа</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Информация о пользователе */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Контактная информация</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Способ доставки */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Способ доставки</h2>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="delivery"
                value="pickup"
                checked={deliveryType === 'pickup'}
                onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700">Самовывоз (бесплатно)</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="delivery"
                value="courier"
                checked={deliveryType === 'courier'}
                onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700">Курьерская доставка (+300 ₽)</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="delivery"
                value="sdek"
                checked={deliveryType === 'sdek'}
                onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700">Пункт выдачи СДЭК (+150 ₽)</span>
            </label>
          </div>
        </div>

        {/* Адрес доставки */}
        {deliveryType === 'courier' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Адрес доставки</h2>
            <AddressForm
              onValid={(address) => {
                setValidAddress(address);
                setError(null);
              }}
            />
          </div>
        )}

        {/* Пункт выдачи СДЭК */}
        {deliveryType === 'sdek' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Пункт выдачи</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Город
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">Выберите город</option>
                  <option value="moscow">Москва</option>
                  <option value="spb">Санкт-Петербург</option>
                  {/* Дополнительные города */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Пункт выдачи
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">Выберите пункт</option>
                  {/* Список пунктов */}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Итоговая информация */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Итого</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Стоимость торта:</span>
              <span>—</span>
            </div>
            <div className="flex justify-between">
              <span>Доставка:</span>
              <span>
                {deliveryType === 'pickup' ? 'Бесплатно' :
                 deliveryType === 'courier' ? '+300 ₽' : '+150 ₽'}
              </span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-semibold text-lg">
              <span>К оплате:</span>
              <span>—</span>
            </div>
          </div>
        </div>

        {/* Ошибки */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Кнопка подтверждения */}
        <button
          type="submit"
          disabled={loading || !user || !draftId}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          {loading ? 'Оформляем заказ...' : 'Подтвердить заказ'}
        </button>
      </form>
    </div>
  );
}
