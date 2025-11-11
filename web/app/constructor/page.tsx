// file: app/constructor/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { calculatePrice } from '@/shared/lib/price/priceCalculator';
import { useDraftCake } from '@/shared/hooks/useDraftCake';
import { MobileLayersSwipe } from '@/components/constructor/MobileLayersSwipe';
import { useMediaQuery } from '@/lib/utils';
import { safeJsonParse } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// ✅ Типы для TypeScript
interface CakeConfig {
  shape: 'round' | 'square';
  size: number;
  layers: Array<{
    id: string;
    type: 'biscuit' | 'cream' | 'topping';
    size: number;
    color?: string;
  }>;
  decorations: number;
  flavors: string[];
  price?: number;
}

// ✅ Безопасное получение draftId из URL
function getDraftIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const url = new URL(window.location.href);
    const draftId = url.searchParams.get('draftId');

    // ✅ Валидация UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (draftId && uuidRegex.test(draftId)) {
      return draftId;
    }

    return null;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}

// ✅ Безопасная загрузка конфигурации из localStorage
function loadConfigFromStorage(): Partial<CakeConfig> | null {
  try {
    const savedConfig = localStorage.getItem('cake-config');
    if (!savedConfig) return null;

    const parsed = safeJsonParse(savedConfig, null);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('Error loading config from storage:', error);
    return null;
  }
}

// ✅ Функция для создания нового слоя
function createNewLayer(): CakeConfig['layers'][0] {
  return {
    id: Math.random().toString(36).substr(2, 9),
    type: 'biscuit',
    size: 20,
    color: '#FCD34D',
  };
}

export default function ConstructorPage() {
  const { user, loading: userLoading } = useUser();
  const { draft, saving, updateConfig } = useDraftCake(user?.id);

  const [localConfig, setLocalConfig] = useState<Partial<CakeConfig>>({
    shape: 'round',
    size: 20,
    layers: [createNewLayer()],
    decorations: 0,
    flavors: [],
  });
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const draftId = getDraftIdFromUrl();

  // ✅ Инициализация конфигурации
  useEffect(() => {
    // Пытаемся загрузить сохраненную конфигурацию
    const savedConfig = loadConfigFromStorage();
    if (savedConfig) {
      setLocalConfig(savedConfig);
    }

    // Загружаем черновик если есть
    if (draft && !localConfig) {
      setLocalConfig(draft.config || {});
    }

    if (user !== undefined) {
      setLoading(false);
    }
  }, [draft, user, localConfig]);

  // ✅ Расчет цены с валидацией
  useEffect(() => {
    try {
      if (localConfig && Object.keys(localConfig).length > 0) {
        const calculatedPrice = calculatePrice(localConfig);
        setPrice(calculatedPrice);
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      setPrice(0);
    }
  }, [localConfig]);

  // ✅ Обработка изменений конфигурации
  const handleConfigChange = useCallback((key: string, value: any) => {
    // ✅ Валидация ключа
    if (key === null || key === undefined || typeof key !== 'string') {
      console.warn('Invalid config key:', key);
      return;
    }

    setLocalConfig(prev => {
      const next = { ...prev, [key]: value };
      setIsDirty(true);

      // Сохраняем в localStorage с обработкой ошибок
      try {
        const configString = JSON.stringify(next);
        if (configString.length < 100000) { // 100KB limit
          localStorage.setItem('cake-config', configString);
        }
      } catch (error) {
        console.error('Failed to save config:', error);
        toast.error('Не удалось сохранить конфигурацию');
      }

      updateConfig(next);
      return next;
    });
  }, [updateConfig]);

  // ✅ Добавление слоя
  const addLayer = useCallback(() => {
    const newLayer = createNewLayer();
    handleConfigChange('layers', [...(localConfig.layers || []), newLayer]);
  }, [localConfig.layers, handleConfigChange]);

  // ✅ Удаление слоя
  const removeLayer = useCallback((layerId: string) => {
    const updatedLayers = (localConfig.layers || []).filter(layer => layer.id !== layerId);
    handleConfigChange('layers', updatedLayers);
  }, [localConfig.layers, handleConfigChange]);

  // ✅ Изменение порядка слоев
  const moveLayer = useCallback((fromIndex: number, toIndex: number) => {
    const layers = [...(localConfig.layers || [])];
    const [movedLayer] = layers.splice(fromIndex, 1);
    layers.splice(toIndex, 0, movedLayer);
    handleConfigChange('layers', layers);
  }, [localConfig.layers, handleConfigChange]);

  // ✅ Безопасный импорт конфигурации из JSON файла
  const importConfigFromFile = useCallback(async (file: File) => {
    try {
      if (file.size > 1024 * 1024) { // 1MB limit
        toast.error('Файл слишком большой');
        return;
      }

      const text = await file.text();
      const parsed = safeJsonParse(text, null);

      if (parsed && typeof parsed === 'object') {
        // ✅ Валидация импортируемой конфигурации
        const validConfig: Partial<CakeConfig> = {};

        if (parsed.shape && ['round', 'square'].includes(parsed.shape)) {
          validConfig.shape = parsed.shape;
        }

        if (typeof parsed.size === 'number' && parsed.size >= 10 && parsed.size <= 100) {
          validConfig.size = parsed.size;
        }

        if (Array.isArray(parsed.layers)) {
          validConfig.layers = parsed.layers.filter(layer =>
            layer && typeof layer === 'object' && layer.id && layer.type
          );
        }

        if (typeof parsed.decorations === 'number' && parsed.decorations >= 0) {
          validConfig.decorations = parsed.decorations;
        }

        if (Array.isArray(parsed.flavors)) {
          validConfig.flavors = parsed.flavors.filter(flavor =>
            typeof flavor === 'string' && flavor.trim().length > 0
          );
        }

        setLocalConfig(prev => ({ ...prev, ...validConfig }));
        setIsDirty(true);
        toast.success('Конфигурация успешно импортирована');
      } else {
        throw new Error('Invalid config format');
      }
    } catch (error) {
      console.error('Failed to import config:', error);
      toast.error('Некорректный файл конфигурации');
    }
  }, []);

  // ✅ Экспорт конфигурации в JSON файл
  const exportConfig = useCallback(() => {
    try {
      const configToExport = {
        ...localConfig,
        price,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      };

      const configString = JSON.stringify(configToExport, null, 2);
      const blob = new Blob([configString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `cake-config-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Конфигурация экспортирована');
    } catch (error) {
      console.error('Failed to export config:', error);
      toast.error('Ошибка при экспорте конфигурации');
    }
  }, [localConfig, price]);

  // ✅ Очистка конфигурации
  const clearConfig = useCallback(() => {
    const defaultConfig = {
      shape: 'round' as const,
      size: 20,
      layers: [createNewLayer()],
      decorations: 0,
      flavors: [],
    };

    setLocalConfig(defaultConfig);
    setIsDirty(false);
    localStorage.removeItem('cake-config');
    toast.success('Конфигурация очищена');
  }, []);

  // ✅ Загрузка состояния
  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем конструктор...</p>
        </div>
      </div>
    );
  }

  // ✅ Требование авторизации
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Необходима авторизация</h1>
          <p className="text-gray-600 mb-6">
            Войдите в систему для создания уникального торта
          </p>
          <button className="btn-primary">
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Конструктор тортов</h1>
          {isDirty && (
            <p className="text-sm text-amber-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Есть несохраненные изменения
            </p>
          )}
        </div>

        {/* ✅ Кнопки управления */}
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importConfigFromFile(file);
            }}
            className="hidden"
            id="config-import"
          />
          <label htmlFor="config-import" className="btn-secondary cursor-pointer">
            Импорт
          </label>
          <button onClick={exportConfig} className="btn-secondary">
            Экспорт
          </button>
          <button onClick={clearConfig} className="btn-secondary">
            Очистить
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Левая колонка - визуализация */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Визуальная модель</h2>
            </div>
            <div className="card-body">
              {isMobile ? (
                <MobileLayersSwipe layers={localConfig.layers || []} />
              ) : (
                <DesktopLayersEditor
                  config={localConfig}
                  onAddLayer={addLayer}
                  onRemoveLayer={removeLayer}
                  onMoveLayer={moveLayer}
                  onConfigChange={handleConfigChange}
                />
              )}
            </div>
          </div>

          {/* ✅ Панель слоев */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Слои торта ({localConfig.layers?.length || 0})</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {(localConfig.layers || []).map((layer, index) => (
                  <LayerCard
                    key={layer.id}
                    layer={layer}
                    index={index}
                    onRemove={() => removeLayer(layer.id)}
                    onMove={(direction) => {
                      const newIndex = direction === 'up' ? index - 1 : index + 1;
                      if (newIndex >= 0 && newIndex < (localConfig.layers?.length || 0)) {
                        moveLayer(index, newIndex);
                      }
                    }}
                    onChange={(updates) => {
                      const updatedLayers = [...(localConfig.layers || [])];
                      updatedLayers[index] = { ...updatedLayers[index], ...updates };
                      handleConfigChange('layers', updatedLayers);
                    }}
                  />
                ))}
              </div>

              <button
                onClick={addLayer}
                className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                + Добавить слой
              </button>
            </div>
          </div>
        </div>

        {/* Правая колонка - параметры */}
        <div className="space-y-6">
          {/* ✅ Основные параметры */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Параметры торта</h2>
            </div>
            <div className="card-body space-y-6">
              {/* Форма */}
              <div>
                <label className="label-required">Форма</label>
                <select
                  className="input-field"
                  value={localConfig.shape || 'round'}
                  onChange={(e) => handleConfigChange('shape', e.target.value)}
                >
                  <option value="round">Круглый</option>
                  <option value="square">Квадратный</option>
                </select>
              </div>

              {/* Размер */}
              <div>
                <label className="label-required">Размер (см)</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                  className="input-field"
                  value={localConfig.size || 20}
                  onChange={(e) => handleConfigChange('size', parseInt(e.target.value) || 20)}
                />
              </div>

              {/* Вкусы */}
              <div>
                <label>Вкусы</label>
                <input
                  type="text"
                  placeholder="Ваниль, шоколад, клубника"
                  className="input-field"
                  value={localConfig.flavors?.join(', ') || ''}
                  onChange={(e) => handleConfigChange('flavors', e.target.value.split(',').map(f => f.trim()).filter(Boolean))}
                />
              </div>

              {/* Декорации */}
              <div>
                <label>Количество декораций</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  className="input-field"
                  value={localConfig.decorations || 0}
                  onChange={(e) => handleConfigChange('decorations', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* ✅ Виджет цены */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Расчётная цена
              </h3>
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {price.toLocaleString('ru-RU')} ₽
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {saving ? 'Сохранение…' : 'Изменения сохранены'}
              </p>

              {/* Прогресс бар сохранения */}
              {saving && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              )}
            </div>
          </div>

          {/* ✅ Кнопки действий */}
          <div className="space-y-3">
            <button
              className="w-full btn-primary py-3"
              onClick={() => {
                if (draft?.id) {
                  window.location.href = `/checkout?draftId=${draft.id}`;
                } else {
                  toast.error('Сначала сохраните конфигурацию');
                }
              }}
            >
              Оформить заказ
            </button>

            {draft?.id && (
              <button
                className="w-full btn-secondary py-3"
                onClick={() => window.open(`/preview/${draft.id}`, '_blank')}
              >
                Предпросмотр
              </button>
            )}
          </div>

          {/* ✅ Информация о сохранении */}
          {draft?.updated_at && (
            <div className="text-sm text-gray-500 text-center">
              Последнее сохранение: {new Date(draft.updated_at).toLocaleString('ru-RU')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ✅ Компонент карточки слоя
function LayerCard({
  layer,
  index,
  onRemove,
  onMove,
  onChange
}: {
  layer: CakeConfig['layers'][0];
  index: number;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onChange: (updates: Partial<CakeConfig['layers'][0]>) => void;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">Слой {index + 1}</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onMove('up')}
            disabled={index === 0}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            ↑
          </button>
          <button
            onClick={() => onMove('down')}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            ↓
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Тип</label>
          <select
            className="input-field"
            value={layer.type}
            onChange={(e) => onChange({ type: e.target.value as any })}
          >
            <option value="biscuit">Бисквит</option>
            <option value="cream">Крем</option>
            <option value="topping">Топпинг</option>
          </select>
        </div>

        <div>
          <label className="text-sm">Размер (см)</label>
          <input
            type="number"
            min="10"
            max="50"
            className="input-field"
            value={layer.size}
            onChange={(e) => onChange({ size: parseInt(e.target.value) || 20 })}
          />
        </div>
      </div>
    </div>
  );
}

// ✅ Компонент десктопного редактора слоев
function DesktopLayersEditor({
  config,
  onAddLayer,
  onRemoveLayer,
  onMoveLayer,
  onConfigChange
}: {
  config: Partial<CakeConfig>;
  onAddLayer: () => void;
  onRemoveLayer: (layerId: string) => void;
  onMoveLayer: (fromIndex: number, toIndex: number) => void;
  onConfigChange: (key: string, value: any) => void;
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
