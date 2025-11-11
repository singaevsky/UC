// file: app/preview/[id]/page.tsx
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { unstable_noStore as noStore } from 'next/cache';
import { getPublicImageUrl } from '@/shared/utils/images';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ✅ Типы для TypeScript
interface DraftCake {
  id: string;
  user_id: string;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  status?: string;
}

// ✅ Серверная функция для получения черновика
async function getDraftById(id: string): Promise<DraftCake | null> {
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
}

// ✅ Компонент для отображения ошибки
function ErrorState({ error }: { error: string }) {
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
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Попробовать снова
        </button>
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
  return (
    <div className="relative bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
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
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Слой {index + 1}</h3>
          <p className="text-sm text-gray-600 capitalize">{layer.type || 'Не указан'}</p>
          {layer.size && (
            <p className="text-sm text-gray-500">Размер: {layer.size} см</p>
          )}
        </div>
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
    // ✅ Валидация UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(params.id)) {
      notFound();
    }

    // ✅ Получаем черновик
    const draft = await getDraftById(params.id);

    if (!draft) {
      notFound();
    }

    const { config } = draft;

    // ✅ Валидация конфигурации
    if (!config || typeof config !== 'object') {
      return (
        <ErrorState error="Некорректная конфигурация торта" />
      );
    }

    // ✅ Извлекаем данные конфигурации
    const shape = config.shape || 'round';
    const size = config.size || 20;
    const flavors = Array.isArray(config.flavors) ? config.flavors : [];
    const layers = Array.isArray(config.layers) ? config.layers : [];
    const decorations = config.decorations || 0;
    const price = config.price || 0;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* ✅ Шапка */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Предпросмотр торта
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Создан: {new Date(draft.created_at).toLocaleString('ru-RU')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Форма</p>
                <p className="font-semibold capitalize">{shape}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ✅ Основной контент */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Левая колонка - визуализация */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-6">Визуальная модель</h2>

                {/* ✅ 3D визуализация торта (упрощённая) */}
                <div className="relative">
                  <div className={`mx-auto rounded-full bg-gradient-to-b from-yellow-200 to-yellow-400 ${
                    shape === 'square' ? 'rounded-lg' : 'rounded-full'
                  }`}
                    style={{
                      width: `${Math.min(size * 4, 300)}px`,
                      height: `${Math.min(size * 4, 300)}px`
                    }}
                  >
                    {/* Слои */}
                    {layers.slice(0, 3).map((layer: any, index: number) => (
                      <div
                        key={index}
                        className={`absolute inset-2 ${
                          shape === 'square' ? 'rounded-md' : 'rounded-full'
                        } bg-opacity-60`}
                        style={{
                          backgroundColor: layer.color || '#FCD34D',
                          transform: `scale(${1 - index * 0.1})`,
                          zIndex: layers.length - index,
                        }}
                      />
                    ))}
                  </div>

                  {/* ✅ Декорации */}
                  {decorations > 0 && (
                    <div className="absolute top-2 right-2 bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium">
                      {decorations} декор.
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ Слои торта */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Слои торта</h3>
                {layers.length > 0 ? (
                  <div className="space-y-3">
                    {layers.map((layer: any, index: number) => (
                      <LayerVisualization key={index} layer={layer} index={index} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Слои не указаны
                  </p>
                )}
              </div>
            </div>

            {/* Правая колонка - параметры */}
            <div className="space-y-6">
              {/* ✅ Основные параметры */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-6">Параметры торта</h2>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Форма:</span>
                    <span className="font-medium capitalize">{shape}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Размер:</span>
                    <span className="font-medium">{size} см</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Слои:</span>
                    <span className="font-medium">{layers.length}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Декорации:</span>
                    <span className="font-medium">{decorations}</span>
                  </div>

                  {flavors.length > 0 && (
                    <div>
                      <span className="text-gray-600 block mb-2">Вкусы:</span>
                      <div className="flex flex-wrap gap-2">
                        {flavors.map((flavor: string, index: number) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                          >
                            {flavor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ Цена */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Расчётная цена
                </h3>
                <p className="text-3xl font-bold text-green-600 mb-2">
                  {price.toLocaleString('ru-RU')} ₽
                </p>
                <p className="text-sm text-gray-600">
                  Цена рассчитана автоматически на основе выбранных параметров
                </p>
              </div>

              {/* ✅ Информация */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Информация
                </h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Это предпросмотр, недоступен для редактирования</li>
                  <li>• Оплата недоступна в режиме предпросмотра</li>
                  <li>• Для оформления заказа вернитесь к конструктору</li>
                </ul>
              </div>

              {/* ✅ Кнопки действий */}
              <div className="space-y-3">
                <button
                  onClick={() => window.close()}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Закрыть предпросмотр
                </button>

                <button
                  onClick={() => window.print()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Сохранить как PDF
                </button>
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
      <ErrorState error="Произошла неожиданная ошибка при загрузке предпросмотра" />
    );
  }
}
