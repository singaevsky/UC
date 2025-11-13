// file: app/preview/[id]/page.tsx
import { notFound } from 'next/navigation';
import { getClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { unstable_noStore as noStore } from 'next/cache';
import { getPublicImageUrl } from '@/shared/utils/images';

const supabase = getClient();

// ✅ Типы для TypeScript
interface DraftCake {
  id: string;
  user_id: string;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  access_count: number;
  status: 'draft' | 'active' | 'converted_to_order' | 'archived' | 'deleted';
  title?: string;
  description?: string;
  version: number;
}

// ✅ Типы для конфигурации торта
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

// ✅ Серверная функция для получения черновика
async function getDraftById(id: string): Promise<DraftCake | null> {
  try {
    const { data, error } = await supabase
      .from('draft_cakes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching draft:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getDraftById:', error);
    return null;
  }
}

// ✅ Безопасная функция для извлечения значений конфигурации
function safeGetConfigValue<T>(config: any, key: string, defaultValue: T): T {
  const value = config?.[key];
  return (value !== undefined && value !== null) ? value : defaultValue;
}

// ✅ Функция валидации UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// ✅ Компонент для отображения ошибки
function ErrorState({ error, showRetry = false }: { error: string; showRetry?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ошибка загрузки</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        {showRetry && (
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Попробовать снова
          </button>
        )}
      </div>
    </div>
  );
}

// ✅ Компонент загрузки
function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Загружаем предпросмотр...</p>
      </div>
    </div>
  );
}

// ✅ Компонент визуализации слоя
function LayerVisualization({ layer, index }: { layer: any; index: number }) {
  const typeLabels = {
    biscuit: 'Бисквит',
    cream: 'Крем',
    topping: 'Топпинг',
  };

  return (
    <div className="relative bg-white rounded-lg shadow-md p-4 mb-4 border">
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {layer.imageUrl ? (
            <Image
              src={getPublicImageUrl(layer.imageUrl)}
              alt={`Слой ${index + 1}`}
              width={80}
              height={80}
              className="object-contain"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-300 rounded"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">Слой {index + 1}</h3>
          <p className="text-sm text-gray-600 capitalize">{typeLabels[layer.type as keyof typeof typeLabels] || layer.type}</p>
          {layer.size && (
            <p className="text-sm text-gray-500">Размер: {layer.size} см</p>
          )}
          {layer.color && (
            <div className="flex items-center mt-1">
              <div
                className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                style={{ backgroundColor: layer.color }}
              ></div>
              <span className="text-xs text-gray-500">Цвет</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ✅ Компонент 3D визуализации торта
function CakeVisualization({ config }: { config: CakeConfig }) {
  const { shape, size, layers = [] } = config;

  const maxSize = Math.min(size * 4, 300);
  const layerColors = {
    biscuit: '#FCD34D', // желтый
    cream: '#FEF3C7', // кремовый
    topping: '#FDE68A', // светло-желтый
  };

  return (
    <div className="flex justify-center">
      <div className="relative">
        {/* Основная форма торта */}
        <div
          className={`mx-auto bg-gradient-to-b from-yellow-200 to-yellow-400 ${
            shape === 'square' ? 'rounded-lg' : 'rounded-full'
          }`}
          style={{
            width: `${maxSize}px`,
            height: `${maxSize}px`,
            maxWidth: '300px',
            maxHeight: '300px',
          }}
        >
          {/* Слои торта */}
          {layers.slice(0, 5).map((layer: any, index: number) => (
            <div
              key={index}
              className={`absolute inset-2 ${
                shape === 'square' ? 'rounded-md' : 'rounded-full'
              } opacity-80`}
              style={{
                backgroundColor: layerColors[layer.type as keyof typeof layerColors] || '#FCD34D',
                transform: `scale(${1 - index * 0.08}) translateY(${index * 2}px)`,
                zIndex: layers.length - index,
              }}
            />
          ))}

          {/* Центральный элемент */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-800 mb-1">
                {size}см
              </div>
              <div className="text-sm text-yellow-700 capitalize">
                {shape === 'square' ? 'Квадратный' : 'Круглый'}
              </div>
            </div>
          </div>
        </div>

        {/* Декорации */}
        {config.decorations > 0 && (
          <div className="absolute -top-2 -right-2 bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
            +{config.decorations} декор.
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ Компонент информации о вкусах
function FlavorTags({ flavors }: { flavors: string[] }) {
  if (!flavors || flavors.length === 0) return null;

  return (
    <div>
      <span className="text-gray-600 block mb-2">Вкусы:</span>
      <div className="flex flex-wrap gap-2">
        {flavors.map((flavor, index) => (
          <span
            key={index}
            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
          >
            {flavor}
          </span>
        ))}
      </div>
    </div>
  );
}

// ✅ Главный компонент страницы
export default async function PreviewPage({
  params
}: {
  params: { id: string }
}) {
  // ✅ Отключаем кеширование для актуальности данных
  noStore();

  try {
    // ✅ Валидация UUID в параметрах
    if (!isValidUUID(params.id)) {
      notFound();
    }

    // ✅ Получаем черновик
    const draft = await getDraftById(params.id);

    if (!draft) {
      return (
        <ErrorState
          error="Черновик не найден. Возможно, он был удален или не существует."
          showRetry={true}
        />
      );
    }

    // ✅ Проверяем статус черновика
    if (draft.status === 'deleted') {
      return (
        <ErrorState error="Этот черновик был удален и недоступен для просмотра." />
      );
    }

    const config = draft?.config;

    // ✅ Валидация конфигурации
    if (!config || typeof config !== 'object') {
      return (
        <ErrorState error="Некорректная конфигурация торта" />
      );
    }

    // ✅ Безопасное извлечение данных конфигурации
    const shape = safeGetConfigValue(config, 'shape', 'round');
    const size = safeGetConfigValue(config, 'size', 20);
    const flavors = safeGetConfigValue(config, 'flavors', []);
    const layers = safeGetConfigValue(config, 'layers', []);
    const decorations = safeGetConfigValue(config, 'decorations', 0);
    const price = safeGetConfigValue(config, 'price', 0);
    const title = safeGetConfigValue(config, 'title', 'Мой торт');
    const description = safeGetConfigValue(config, 'description', '');

    // ✅ Валидация значений
    const validShapes = ['round', 'square'];
    const validShape = validShapes.includes(shape) ? shape : 'round';

    const validSize = typeof size === 'number' && size > 0 && size <= 100 ? size : 20;
    const validLayers = Array.isArray(layers) ? layers : [];
    const validDecorations = typeof decorations === 'number' && decorations >= 0 ? decorations : 0;
    const validPrice = typeof price === 'number' && price >= 0 ? price : 0;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* ✅ Шапка */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {title}
                  </h1>
                  {draft.status === 'draft' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Черновик
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                  <span>
                    Создан: {new Date(draft.created_at).toLocaleString('ru-RU')}
                  </span>
                  {draft.updated_at !== draft.created_at && (
                    <span>
                      Обновлен: {new Date(draft.updated_at).toLocaleString('ru-RU')}
                    </span>
                  )}
                  <span>
                    Версия: {draft.version}
                  </span>
                </div>
                {description && (
                  <p className="mt-2 text-gray-600 text-sm line-clamp-2">
                    {description}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Форма</p>
                  <p className="font-semibold capitalize">
                    {validShape === 'round' ? 'Круглый' : 'Квадратный'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ✅ Основной контент */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Левая колонка - визуализация */}
            <div className="space-y-6">
              {/* ✅ 3D визуализация торта */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-6 text-gray-900">
                  3D визуализация
                </h2>
                <CakeVisualization config={{ shape: validShape, size: validSize, layers: validLayers, decorations: validDecorations }} />
              </div>

              {/* ✅ Слои торта */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Слои торта ({validLayers.length})
                </h3>
                {validLayers.length > 0 ? (
                  <div className="space-y-3">
                    {validLayers.map((layer: any, index: number) => (
                      <LayerVisualization
                        key={layer.id || index}
                        layer={layer}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p>Слои не указаны</p>
                  </div>
                )}
              </div>
            </div>

            {/* Правая колонка - параметры */}
            <div className="space-y-6">
              {/* ✅ Основные параметры */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-6 text-gray-900">
                  Параметры торта
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Форма:</span>
                    <span className="font-medium capitalize">
                      {validShape === 'round' ? 'Круглый' : 'Квадратный'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Размер:</span>
                    <span className="font-medium">{validSize} см</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Слои:</span>
                    <span className="font-medium">{validLayers.length}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Декорации:</span>
                    <span className="font-medium">{validDecorations}</span>
                  </div>

                  <FlavorTags flavors={flavors} />
                </div>
              </div>

              {/* ✅ Цена */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Расчётная цена
                </h3>
                <p className="text-3xl font-bold text-green-600 mb-2">
                  {validPrice.toLocaleString('ru-RU')} ₽
                </p>
                <p className="text-sm text-gray-600">
                  Цена рассчитана автоматически на основе выбранных параметров
                </p>
                {validDecorations > 20 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Большое количество декораций может увеличить итоговую стоимость
                    </p>
                  </div>
                )}
              </div>

              {/* ✅ Информация о предпросмотре */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">
                  <svg className="inline w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Информация о предпросмотре
                </h3>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Это предпросмотр, недоступен для редактирования
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Оплата недоступна в режиме предпросмотра
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Для оформления заказа вернитесь к конструктору
                  </li>
                  {validLayers.length === 0 && (
                    <li className="flex items-start">
                      <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Добавьте слои для более детального предпросмотра
                    </li>
                  )}
                </ul>
              </div>

              {/* ✅ Кнопки действий */}
              <div className="space-y-3">
                <button
                  onClick={() => window.close()}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Закрыть предпросмотр
                </button>

                <button
                  onClick={() => window.print()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Сохранить как PDF
                </button>

                <a
                  href={`/constructor?draftId=${draft.id}`}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center text-center block"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Редактировать в конструкторе
                </a>
              </div>

              {/* ✅ Метаданные */}
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">ID:</span>
                    <br />
                    <span className="font-mono text-xs">{draft.id}</span>
                  </div>
                  <div>
                    <span className="font-medium">Версия:</span>
                    <br />
                    <span>{draft.version}</span>
                  </div>
                  <div>
                    <span className="font-medium">Доступов:</span>
                    <br />
                    <span>{draft.access_count}</span>
                  </div>
                  <div>
                    <span className="font-medium">Последний доступ:</span>
                    <br />
                    <span>{new Date(draft.last_accessed_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    // ✅ Обработка неожиданных ошибок
    console.error('Error in preview page:', error);
    return (
      <ErrorState
        error="Произошла неожиданная ошибка при загрузке предпросмотра"
        showRetry={true}
      />
    );
  }
}

// ✅ Экспорт типов для использования в других частях приложения
export type { DraftCake, CakeConfig };
