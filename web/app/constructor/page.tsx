// file: app/constructor/page.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useDraftCake } from '@/hooks/useDraftCake';
import { calculatePrice } from '@/shared/lib/price/priceCalculator';
import { useOptimizedDraft } from '@/hooks/useOptimizedDraft';

export default function ConstructorPage() {
  const { user } = useUser();

  // Если хотите использовать оптимизированный хук – раскомментируйте
  // const { draft, saving, load, setDraft } = useOptimizedDraft(user?.id);
  // const [config, setConfig] = useState<any>(draft?.config || {});

  // Старый вариант (без оптимизации)
  const { draft, saving, updateConfig } = useDraftCake(user?.id);
  const [config, setConfig] = useState<any>(draft?.config || {});

  // Синхронизация локального стейта с полученным черновиком
  useEffect(() => {
    if (draft?.config) setConfig(draft.config);
  }, [draft?.config]);

  // Синхронизация с сервером (каждый раз при изменении config)
  const [price, setPrice] = useState<number>(0);
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

  const clientPrice = calculatePrice(config);
  const displayedPrice = price ?? clientPrice;

  const handleChange = (key: string, value: any) => {
    const next = { ...config, [key]: value };
    setConfig(next);
    updateConfig(next);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Конструктор тортов</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-2">Форма</label>
          <select
            className="border p-2 rounded"
            value={config.shape || 'round'}
            onChange={(e) => handleChange('shape', e.target.value)}
          >
            <option value="round">Круглый</option>
            <option value="square">Квадратный</option>
          </select>

          {/* Пример поля – размер */}
          <label className="block mt-4 mb-2">Размер (см)</label>
          <input
            type="number"
            className="border p-2 rounded"
            value={config.size || 20}
            onChange={(e) => handleChange('size', Number(e.target.value))}
          />

          {/* Пример поля – вкусы */}
          <label className="block mt-4 mb-2">Вкусы (через запятую)</label>
          <input
            className="border p-2 rounded"
            value={config.flavors?.join(', ') || ''}
            onChange={(e) => handleChange('flavors', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          />

          {/* Слои (демо) */}
          <label className="block mt-4 mb-2">Слои (пример)</label>
          <textarea
            className="border p-2 rounded h-24"
            placeholder="JSON массив слоёв, напр. [{'type':'cream','size':20}]"
            value={JSON.stringify(config.layers || [], null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleChange('layers', parsed);
              } catch {
                // Игнорируем невалидный JSON
              }
            }}
          />
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h2 className="text-lg font-semibold">Текущая цена</h2>
          <p className="text-2xl font-bold">{displayedPrice} ₽</p>
          <p className="text-sm text-gray-500">{saving ? 'Сохранение…' : 'Сохранено'}</p>
          <a href={`/preview/${draft?.id}`} className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded">
            Предпросмотр
          </a>
        </div>
      </div>
    </div>
  );
}
