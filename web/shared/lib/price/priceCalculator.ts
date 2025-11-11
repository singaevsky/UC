// file: shared/lib/price/priceCalculator.ts

// ✅ Типы для лучшей типизации
export type LayerType = 'biscuit' | 'cream' | 'topping';
export type CakeShape = 'round' | 'square';

export interface CakeLayer {
  type: LayerType;
  size: number; // диаметр слоя в см
  count?: number; // количество слоёв такого типа
  color?: string; // цвет слоя для визуализации
}

export interface CakeConfig {
  layers: CakeLayer[];
  shape: CakeShape;
  decorations: number; // количество декоративных элементов
  size?: number; // общий размер торта (см)
  flavors?: string[]; // вкусы
  customOptions?: Record<string, any>; // дополнительные опции
}

// ✅ Константы для ценовых коэффициентов
export const PRICE_CONFIG = {
  BASE_PRICE: 1000, // базовая стоимость любого торта
  LAYER_COEFFICIENT: {
    biscuit: 1.0,    // бисквит - базовая стоимость
    cream: 0.8,      // крем - дешевле бисквита
    topping: 0.5,    // топпинг - самый дешевый слой
  },
  SHAPE_MULTIPLIER: {
    round: 1.0,    // круглый - базовая цена
    square: 1.1,   // квадратный +10%
  },
  DECORATION_PRICE: 50, // стоимость одного декоративного элемента
  MIN_SIZE: 10,   // минимальный размер торта (см)
  MAX_SIZE: 50,   // максимальный размер торта (см)
  AREA_PRICE_FACTOR: 0.3, // коэффициент для расчёта стоимости по площади
  MAX_LAYERS: 10, // максимальное количество слоев
  MAX_DECORATIONS: 50, // максимальное количество декораций
} as const;

// ✅ Типы для детального расчёта
export interface PriceBreakdown {
  basePrice: number;
  layersCost: number;
  decorationCost: number;
  shapeMultiplier: number;
  sizeAdjustment: number;
  totalPrice: number;
  warnings: string[];
  recommendations: string[];
}

// ✅ Валидация конфигурации торта
export function validateCakeConfig(config: Partial<CakeConfig>): config is CakeConfig {
  if (!config.layers || !Array.isArray(config.layers) || config.layers.length === 0) {
    throw new Error('Торт должен содержать хотя бы один слой');
  }

  if (!config.shape || !['round', 'square'].includes(config.shape)) {
    throw new Error('Не указана или некорректная форма торта');
  }

  // Проверяем максимальное количество слоев
  if (config.layers.length > PRICE_CONFIG.MAX_LAYERS) {
    throw new Error(`Максимальное количество слоев: ${PRICE_CONFIG.MAX_LAYERS}`);
  }

  // Проверяем каждый слой
  config.layers.forEach((layer, index) => {
    if (!layer.type || !['biscuit', 'cream', 'topping'].includes(layer.type)) {
      throw new Error(`Некорректный тип слоя в позиции ${index + 1}`);
    }

    if (typeof layer.size !== 'number' || layer.size < 10 || layer.size > 100) {
      throw new Error(`Некорректный размер слоя в позиции ${index + 1}. Размер должен быть от 10 до 100 см`);
    }

    if (layer.count && (layer.count < 1 || layer.count > 5)) {
      throw new Error(`Некорректное количество слоев типа ${layer.type} в позиции ${index + 1}`);
    }
  });

  if (typeof config.decorations !== 'number' || config.decorations < 0) {
    throw new Error('Количество декоративных элементов должно быть неотрицательным числом');
  }

  if (config.decorations > PRICE_CONFIG.MAX_DECORATIONS) {
    throw new Error(`Максимальное количество декораций: ${PRICE_CONFIG.MAX_DECORATIONS}`);
  }

  // Проверяем общий размер если указан
  if (config.size && (config.size < PRICE_CONFIG.MIN_SIZE || config.size > PRICE_CONFIG.MAX_SIZE)) {
    throw new Error(`Общий размер должен быть от ${PRICE_CONFIG.MIN_SIZE} до ${PRICE_CONFIG.MAX_SIZE} см`);
  }

  // Проверяем вкусы
  if (config.flavors) {
    if (!Array.isArray(config.flavors) || config.flavors.length === 0) {
      throw new Error('Вкусы должны быть массивом строк');
    }

    config.flavors.forEach((flavor, index) => {
      if (typeof flavor !== 'string' || flavor.trim().length === 0) {
        throw new Error(`Некорректный вкус в позиции ${index + 1}`);
      }
    });
  }

  return true;
}

// ✅ Расчёт площади слоя с учетом формы
function calculateLayerArea(size: number, type: LayerType, shape: CakeShape): number {
  const radius = size / 2;
  let area: number;

  if (shape === 'square') {
    // Приблизительный расчет площади квадрата
    area = size * size;
  } else {
    // Площадь круга
    area = Math.PI * radius * radius;
  }

  // Применяем коэффициент в зависимости от типа слоя
  const coefficient = PRICE_CONFIG.LAYER_COEFFICIENT[type];
  return area * coefficient;
}

// ✅ Расчёт стоимости слоёв
function calculateLayersCost(layers: CakeLayer[], shape: CakeShape): number {
  return layers.reduce((total, layer) => {
    const area = calculateLayerArea(layer.size, layer.type, shape);
    const count = layer.count || 1;
    return total + (area * count);
  }, 0);
}

// ✅ Расчёт корректировки размера
function calculateSizeAdjustment(config: CakeConfig): number {
  if (!config.size) return 0;

  const avgLayerSize = config.layers.reduce((sum, layer) => sum + layer.size, 0) / config.layers.length;
  const sizeDiff = Math.abs(config.size - avgLayerSize);

  // Если общий размер сильно отличается от среднего размера слоев
  if (sizeDiff > 10) {
    return Math.round(sizeDiff * 10); // 10 рублей за каждый сантиметр разницы
  }

  return 0;
}

// ✅ Генерация предупреждений
function generateWarnings(config: CakeConfig): string[] {
  const warnings: string[] = [];

  // Предупреждение о большом количестве слоев
  if (config.layers.length > 7) {
    warnings.push('Большое количество слоев может увеличить время приготовления');
  }

  // Предупреждение о большом количестве декораций
  if (config.decorations > 30) {
    warnings.push('Большое количество декораций значительно увеличивает стоимость');
  }

  // Предупреждение о квадратной форме
  if (config.shape === 'square') {
    warnings.push('Квадратная форма на 10% дороже круглой');
  }

  // Предупреждение о большом размере
  const totalSize = config.layers.reduce((sum, layer) => sum + layer.size, 0);
  if (totalSize > 150) {
    warnings.push('Большой общий размер торта может увеличить стоимость');
  }

  return warnings;
}

// ✅ Генерация рекомендаций
function generateRecommendations(config: CakeConfig): string[] {
  const recommendations: string[] = [];

  // Рекомендации по оптимизации цены
  if (config.layers.length > 5) {
    recommendations.push('Рассмотрите возможность уменьшения количества слоёв для снижения стоимости');
  }

  if (config.decorations > 20) {
    recommendations.push('Большое количество декораций увеличивает стоимость. Рассмотрите упрощение декора');
  }

  // Рекомендации по балансу слоев
  const layerTypes = config.layers.map(l => l.type);
  if (layerTypes.filter(t => t === 'topping').length > layerTypes.length / 2) {
    recommendations.push('Рекомендуем добавить больше структурных слоев (бисквит/крем) для стабильности торта');
  }

  // Рекомендации по размеру
  if (config.layers.some(l => l.size > 40)) {
    recommendations.push('Большие слои могут потребовать дополнительного времени для пропитки');
  }

  return recommendations;
}

// ✅ Основная функция расчёта цены
export function calculatePrice(config: Partial<CakeConfig>): number {
  // Валидация входных данных
  if (!validateCakeConfig(config)) {
    throw new Error('Некорректная конфигурация торта');
  }

  try {
    const validConfig = config as CakeConfig;

    // Базовая стоимость
    const basePrice = PRICE_CONFIG.BASE_PRICE;

    // Стоимость слоёв (по площади)
    const layersCost = calculateLayersCost(validConfig.layers, validConfig.shape);

    // Стоимость декораций
    const decorationCost = validConfig.decorations * PRICE_CONFIG.DECORATION_PRICE;

    // Применяем множитель формы
    const shapeMultiplier = PRICE_CONFIG.SHAPE_MULTIPLIER[validConfig.shape];

    // Корректировка размера
    const sizeAdjustment = calculateSizeAdjustment(validConfig);

    // Итоговый расчёт
    const subtotal = (basePrice + layersCost * PRICE_CONFIG.AREA_PRICE_FACTOR + decorationCost + sizeAdjustment) * shapeMultiplier;

    // Округляем до целых рублей
    const finalPrice = Math.round(subtotal);

    // Проверяем разумные границы
    if (finalPrice < 500) {
      return 500; // минимальная цена
    }

    if (finalPrice > 100000) {
      return 100000; // максимальная цена
    }

    return finalPrice;
  } catch (error) {
    console.error('Error calculating price:', error);
    // В случае ошибки возвращаем базовую цену
    return PRICE_CONFIG.BASE_PRICE;
  }
}

// ✅ Функция для детального расчёта (для UI)
export function calculateDetailedPrice(config: Partial<CakeConfig>): PriceBreakdown {
  if (!validateCakeConfig(config)) {
    throw new Error('Некорректная конфигурация торта');
  }

  const validConfig = config as CakeConfig;

  const basePrice = PRICE_CONFIG.BASE_PRICE;
  const layersCost = calculateLayersCost(validConfig.layers, validConfig.shape) * PRICE_CONFIG.AREA_PRICE_FACTOR;
  const decorationCost = validConfig.decorations * PRICE_CONFIG.DECORATION_PRICE;
  const shapeMultiplier = PRICE_CONFIG.SHAPE_MULTIPLIER[validConfig.shape];
  const sizeAdjustment = calculateSizeAdjustment(validConfig);

  const subtotal = (basePrice + layersCost + decorationCost + sizeAdjustment) * shapeMultiplier;
  const totalPrice = Math.max(500, Math.min(100000, Math.round(subtotal)));

  const warnings = generateWarnings(validConfig);
  const recommendations = generateRecommendations(validConfig);

  return {
    basePrice,
    layersCost: Math.round(layersCost),
    decorationCost,
    shapeMultiplier,
    sizeAdjustment,
    totalPrice,
    warnings,
    recommendations,
  };
}

// ✅ Функция для получения рекомендаций по оптимизации цены
export function getPriceRecommendations(config: Partial<CakeConfig>): string[] {
  if (!validateCakeConfig(config)) {
    return ['Некорректная конфигурация торта'];
  }

  const validConfig = config as CakeConfig;
  return generateRecommendations(validConfig);
}

// ✅ Функция для расчёта стоимости с учетом скидок
export function calculatePriceWithDiscount(
  config: Partial<CakeConfig>,
  discountPercent: number = 0,
  discountAmount: number = 0
): { originalPrice: number; discountPercent: number; discountAmount: number; finalPrice: number } {
  const originalPrice = calculatePrice(config);

  const discountFromPercent = Math.round(originalPrice * (discountPercent / 100));
  const totalDiscount = discountFromPercent + discountAmount;
  const finalPrice = Math.max(originalPrice - totalDiscount, Math.round(originalPrice * 0.5)); // максимальная скидка 50%

  return {
    originalPrice,
    discountPercent,
    discountAmount: totalDiscount,
    finalPrice,
  };
}

// ✅ Функция для сравнения цен разных конфигураций
export function compareConfigurations(configs: Partial<CakeConfig>[]): Array<{ config: CakeConfig; price: number; breakdown: PriceBreakdown }> {
  return configs.map(config => {
    const price = calculatePrice(config);
    const breakdown = calculateDetailedPrice(config);
    return {
      config: config as CakeConfig,
      price,
      breakdown,
    };
  }).sort((a, b) => a.price - b.price);
}

// ✅ Экспорт констант для использования в других частях приложения
export { PRICE_CONFIG };
