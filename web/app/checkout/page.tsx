// file: app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { AddressForm } from '@/components/checkout/AddressForm';
import { useMediaQuery } from '@/lib/utils';
import { toast } from 'react-hot-toast';

type DeliveryType = 'pickup' | 'courier' | 'sdek';

type AddressData = {
  city: string;
  street: string;
  house: string;
  apartment?: string;
};

interface CheckoutFormData {
  delivery_type: DeliveryType;
  delivery_address?: string;
  delivery_pickup_point_id?: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  comment?: string;
}

export default function CheckoutPage() {
  const { user, loading: userLoading } = useUser();

  const [formData, setFormData] = useState<CheckoutFormData>({
    delivery_type: 'pickup',
    contact_name: '',
    contact_phone: '',
    contact_email: user?.email || '',
  });
  const [validAddress, setValidAddress] = useState<AddressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState<number>(0);

  const isMobile = useMediaQuery('(max-width: 768px)');

  // Получаем draftId из URL
  const draftId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('draftId')
    : null;

  // ✅ Загрузка данных заказа при монтировании
  useEffect(() => {
    if (draftId) {
      loadOrderData();
    }
  }, [draftId]);

  // ✅ Загрузка данных заказа
  const loadOrderData = async () => {
    try {
      const response = await fetch(`/api/orders?draftId=${draftId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.order) {
          setOrderTotal(data.order.total_price || 0);
        }
      }
    } catch (error) {
      console.error('Failed to load order data:', error);
    }
  };

  // ✅ Валидация пользователя
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Необходима авторизация</h1>
          <p className="text-gray-600 mb-6">
            Войдите в систему для оформления заказа
          </p>
          <button className="btn-primary">
            Войти
          </button>
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
      // ✅ Валидация перед отправкой
      if (formData.delivery_type === 'courier' && !validAddress) {
        throw new Error('Пожалуйста, укажите корректный адрес доставки');
      }

      if (formData.delivery_type === 'sdek' && !formData.delivery_pickup_point_id) {
        throw new Error('Пожалуйста, выберите пункт выдачи СДЭК');
      }

      // ✅ Подготовка данных для отправки
      const orderData = {
        userId: user.id,
        delivery_type: formData.delivery_type,
        delivery_address: validAddress ?
          `${validAddress.city}, ${validAddress.street}, д. ${validAddress.house}${validAddress.apartment ? ', кв. ' + validAddress.apartment : ''}` :
          undefined,
        delivery_pickup_point_id: formData.delivery_pickup_point_id,
        cake_config: {}, // Получим из черновика
        draftId,
        contact: {
          name: formData.contact_name,
          phone: formData.contact_phone,
          email: formData.contact_email,
        },
        comment: formData.comment,
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
      setOrderTotal(data.order.total_price || 0);

      // ✅ Перенаправляем на страницу подтверждения
      window.location.href = `/order-confirmation/${data.order.id}`;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      toast.error('Ошибка оформления заказа');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Обновление данных формы
  const updateFormData = (updates: Partial<CheckoutFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setError(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Оформление заказа</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ✅ Информация о пользователе */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Контактная информация</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label-required">Имя</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.contact_name}
                  onChange={(e) => updateFormData({ contact_name: e.target.value })}
                  placeholder="Ваше имя"
                  required
                />
              </div>

              <div>
                <label className="label-required">Телефон</label>
                <input
                  type="tel"
                  className="input-field"
                  value={formData.contact_phone}
                  onChange={(e) => updateFormData({ contact_phone: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-required">Email</label>
              <input
                type="email"
                className="input-field"
                value={formData.contact_email}
                onChange={(e) => updateFormData({ contact_email: e.target.value })}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>
        </div>

        {/* ✅ Способ доставки */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Способ доставки</h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  value="pickup"
                  checked={formData.delivery_type === 'pickup'}
                  onChange={(e) => updateFormData({ delivery_type: e.target.value as DeliveryType })}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-medium">Самовывоз</span>
                  <p className="text-sm text-gray-500">Бесплатно, готово через 2-3 часа</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  value="courier"
                  checked={formData.delivery_type === 'courier'}
                  onChange={(e) => updateFormData({ delivery_type: e.target.value as DeliveryType })}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-medium">Курьерская доставка</span>
                  <p className="text-sm text-gray-500">+300 ₽, доставка в течение дня</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  value="sdek"
                  checked={formData.delivery_type === 'sdek'}
                  onChange={(e) => updateFormData({ delivery_type: e.target.value as DeliveryType })}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-medium">Пункт выдачи СДЭК</span>
                  <p className="text-sm text-gray-500">+150 ₽, доставка за 1-2 дня</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ✅ Адрес доставки для курьера */}
        {formData.delivery_type === 'courier' && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Адрес доставки</h2>
            </div>
            <div className="card-body">
              <AddressForm
                onValid={(address) => {
                  setValidAddress(address);
                  setError(null);
                }}
                initialData={{
                  city: '',
                  street: '',
                  house: '',
                  apartment: '',
                }}
              />
            </div>
          </div>
        )}

        {/* ✅ Пункт выдачи СДЭК */}
        {formData.delivery_type === 'sdek' && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Пункт выдачи СДЭК</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label-required">Город</label>
                <select
                  className="input-field"
                  value={formData.delivery_pickup_point_id?.split(':')[0] || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      updateFormData({ delivery_pickup_point_id: `${e.target.value}:point1` });
                    }
                  }}
                >
                  <option value="">Выберите город</option>
                  <option value="moscow">Москва</option>
                  <option value="spb">Санкт-Петербург</option>
                  <option value="novosibirsk">Новосибирск</option>
                  <option value="ekaterinburg">Екатеринбург</option>
                </select>
              </div>

              <div>
                <label className="label-required">Пункт выдачи</label>
                <select
                  className="input-field"
                  value={formData.delivery_pickup_point_id || ''}
                  onChange={(e) => updateFormData({ delivery_pickup_point_id: e.target.value })}
                >
                  <option value="">Выберите пункт</option>
                  <option value="moscow:point1">Пункт 1 (м. Кузнецкий мост)</option>
                  <option value="moscow:point2">Пункт 2 (м. Тверская)</option>
                  <option value="spb:point1">Пункт 1 (м. Невский проспект)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Комментарий к заказу */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Комментарий к заказу</h2>
          </div>
          <div className="card-body">
            <textarea
              className="input-field"
              rows={4}
              value={formData.comment || ''}
              onChange={(e) => updateFormData({ comment: e.target.value })}
              placeholder="Дополнительные пожелания к торту или доставке..."
            />
          </div>
        </div>

        {/* ✅ Итоговая информация */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Итого</h2>
          </div>
          <div className="card-body">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Стоимость торта:</span>
                <span>{orderTotal.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex justify-between">
                <span>Доставка:</span>
                <span>
                  {formData.delivery_type === 'pickup' ? 'Бесплатно' :
                   formData.delivery_type === 'courier' ? '+300 ₽' : '+150 ₽'}
                </span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-lg">
                <span>К оплате:</span>
                <span>
                  {formData.delivery_type === 'pickup' ? orderTotal :
                   orderTotal + (formData.delivery_type === 'courier' ? 300 : 150)} ₽
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Ошибки */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* ✅ Кнопка подтверждения */}
        <button
          type="submit"
          disabled={loading || !user || !draftId || !formData.contact_name || !formData.contact_phone || !formData.contact_email}
          className="w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Оформляем заказ...' : 'Подтвердить заказ'}
        </button>

        {/* ✅ Информация о времени обработки */}
        <div className="text-center text-sm text-gray-500">
          <p>Заказ будет обработан в течение 30 минут в рабочее время</p>
        </div>
      </form>
    </div>
  );
}
