// file: app/constructor/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { calculatePrice } from '@/shared/lib/price/priceCalculator';
import { useDraftCake } from '@/shared/hooks/useDraftCake';
import { MobileLayersSwipe } from '@/components/constructor/MobileLayersSwipe';
import { useMediaQuery } from '@/lib/utils';

export default function ConstructorPage() {
  const { user, loading: userLoading } = useUser();
  const { draft, saving, updateConfig } = useDraftCake(user?.id);

  // ✅ Правильная типизация состояния
  const [localConfig, setLocalConfig] = useState<Record<string, any>>({});
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const isMobile = useMediaQuery('(max-width: 768px)');

  // ✅ Загрузка черновика при монтировании
  useEffect(() => {
    if (draft && !localConfig) {
      setLocalConfig(draft.config);
    }
    if (user !== undefined) {
      setLoading(false);
    }
  }, [draft, user, localConfig]);

  // ✅ Серверный расчёт цены с фолбэком на клиентский
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: localConfig }),
        });

        if (res.ok) {
          const data = await res.json();
          setPrice(data.price);
        } else {
          // Фолбэк на клиентский расчёт
          setPrice(calculatePrice(localConfig));
        }
      } catch (error) {
        console.error('Price calculation failed:', error);
        setPrice(calculatePrice(localConfig));
      }
    };

    if (Object.keys(localConfig).length > 0) {
      fetchPrice();
    }
  }, [localConfig]);

  // ✅ Управление конфигурацией
  const handleConfigChange = (key: string, value: any) => {
    const nextConfig = { ...localConfig, [key]: value };
    setLocalConfig(nextConfig);
    updateConfig(nextConfig);
  };

  // ✅ Условный рендеринг
  if (userLoading || loading) {
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
          <p>Войдите в систему для создания торта</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Конструктор тортов</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Левая колонка - визуализация */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Визуальная модель</h2>

            {isMobile ? (
              <MobileLayersSwipe layers={localConfig.layers || []} />
            ) : (
              // Десктопный редактор слоёв
              <DesktopLayersEditor
                config={localConfig}
                onChange={handleConfigChange}
              />
            )}
          </div>
        </div>

        {/* Правая колонка - параметры */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Параметры торта</h2>

            {/* Форма параметров */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Форма
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={localConfig.shape || 'round'}
                  onChange={(e) => handleConfigChange('shape', e.target.value)}
                >
                  <option value="round">Круглый</option>
                  <option value="square">Квадратный</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Размер (см)
                </label>
                <input
                  type="number"
                  min="10"
                  max="50"
                  step="5"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={localConfig.size || 20}
                  onChange={(e) => handleConfigChange('size', parseInt(e.target.value))}
                />
              </div>

              {/* Дополнительные параметры */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Вкусы
                </label>
                <input
                  type="text"
                  placeholder="Ваниль, шоколад, клубника"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={localConfig.flavors?.join(', ') || ''}
                  onChange={(e) => handleConfigChange('flavors', e.target.value.split(',').map(f => f.trim()))}
                />
              </div>
            </div>
          </div>

          {/* Виджет цены */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Расчётная цена</h3>
            <p className="text-3xl font-bold text-blue-600">{price} ₽</p>
            <p className="text-sm text-blue-500 mt-1">
              {saving ? 'Сохранение…' : 'Изменения сохранены'}
            </p>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-4">
            <button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              onClick={() => window.location.href = `/checkout?draftId=${draft?.id}`}
            >
              Оформить заказ
            </button>

            {draft?.id && (
              <button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                onClick={() => window.open(`/preview/${draft.id}`, '_blank')}
              >
                Предпросмотр
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ Вынесенный компонент для десктопа (для примера)
function DesktopLayersEditor({
  config,
  onChange
}: {
  config: Record<string, any>;
  onChange: (key: string, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Слои торта</h3>
          <p className="text-sm text-gray-600">Перетащите слои для изменения порядка</p>
          {/* Здесь будет drag & drop интерфейс */}
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Декор</h3>
          <p className="text-sm text-gray-600">Добавьте украшения</p>
          {/* Здесь будет палитра декора */}
        </div>
      </div>
    </div>
  );
}
