// file: shared/lib/price/priceCalculator.ts

// ✅ Типы для лучшей типизации
export type LayerType = 'biscuit' | 'cream' | 'topping';
export type CakeShape = 'round' | 'square';

export interface CakeLayer {
  type: LayerType;
  size: number; // диаметр слоя в см
  count?: number; // количество слоёв такого типа
}

export interface CakeConfig {
  layers: CakeLayer[];
  shape: CakeShape;
  decorations: number; // количество декоративных элементов
  size?: number; // общий размер торта (см)
}

// ✅ Константы для ценовых коэффициентов
export const PRICE_CONFIG = {
  BASE_PRICE: 1000, // базовая стоимость любого торта
  LAYER_COEFFICIENT: {
    biscuit: 1.0,
    cream: 0.8,
    topping: 0.5,
  },
  SHAPE_MULTIPLIER: {
    round: 1.0,
    square: 1.1,
  },
  DECORATION_PRICE: 50, // стоимость одного декоративного элемента
  MIN_SIZE: 10, // минимальный размер торта (см)
  MAX_SIZE: 50, // максимальный размер торта (см)
  AREA_PRICE_FACTOR: 0.3, // коэффициент для расчёта стоимости по площади
} as const;

// ✅ Валидация конфигурации торта
export function validateCakeConfig(config: Partial<CakeConfig>): config is CakeConfig {
  if (!config.layers || !Array.isArray(config.layers) || config.layers.length === 0) {
    throw new Error('Торт должен содержать хотя бы один слой');
  }

  if (!config.shape || !['round', 'square'].includes(config.shape)) {
    throw new Error('Не указана или некорректная форма торта');
  }

  // Проверяем каждый слой
  config.layers.forEach((layer, index) => {
    if (!layer.type || !['biscuit', 'cream', 'topping'].includes(layer.type)) {
      throw new Error(`Некорректный тип слоя в позиции ${index + 1}`);
    }

    if (typeof layer.size !== 'number' || layer.size < 10 || layer.size > 100) {
      throw new Error(`Некорректный размер слоя в позиции ${index + 1}. Размер должен быть от 10 до 100 см`);
    }
  });

  if (typeof config.decorations !== 'number' || config.decorations < 0) {
    throw new Error('Количество декоративных элементов должно быть неотрицательным числом');
  }

  return true;
}

// ✅ Расчёт площади слоя
function calculateLayerArea(size: number, type: LayerType): number {
  const radius = size / 2;
  const area = Math.PI * radius * radius;

  // Применяем коэффициент в зависимости от типа слоя
  const coefficient = PRICE_CONFIG.LAYER_COEFFICIENT[type];
  return area * coefficient;
}

// ✅ Расчёт стоимости слоёв
function calculateLayersCost(layers: CakeLayer[]): number {
  return layers.reduce((total, layer) => {
    const area = calculateLayerArea(layer.size, layer.type);
    const count = layer.count || 1;
    return total + (area * count);
  }, 0);
}

// ✅ Основная функция расчёта цены
export function calculatePrice(config: Partial<CakeConfig>): number {
  // Валидация входных данных
  if (!validateCakeConfig(config)) {
    throw new Error('Некорректная конфигурация торта');
  }

  try {
    // Базовая стоимость
    const basePrice = PRICE_CONFIG.BASE_PRICE;

    // Стоимость слоёв (по площади)
    const layersCost = calculateLayersCost(config.layers);

    // Стоимость декораций
    const decorationCost = config.decorations * PRICE_CONFIG.DECORATION_PRICE;

    // Применяем множитель формы
    const shapeMultiplier = PRICE_CONFIG.SHAPE_MULTIPLIER[config.shape];

    // Итоговый расчёт
    const subtotal = (basePrice + layersCost * PRICE_CONFIG.AREA_PRICE_FACTOR + decorationCost) * shapeMultiplier;

    // Округляем до целых рублей
    const finalPrice = Math.round(subtotal);

    // Проверяем разумные границы
    if (finalPrice < 500) {
      return 500; // минимальная цена
    }

    if (finalPrice > 50000) {
      return 50000; // максимальная цена
    }

    return finalPrice;
  } catch (error) {
    console.error('Error calculating price:', error);
    // В случае ошибки возвращаем базовую цену
    return PRICE_CONFIG.BASE_PRICE;
  }
}

// ✅ Дополнительная функция для детального расчёта (для UI)
export interface PriceBreakdown {
  basePrice: number;
  layersCost: number;
  decorationCost: number;
  shapeMultiplier: number;
  totalPrice: number;
}

export function calculateDetailedPrice(config: Partial<CakeConfig>): PriceBreakdown {
  if (!validateCakeConfig(config)) {
    throw new Error('Некорректная конфигурация торта');
  }

  const basePrice = PRICE_CONFIG.BASE_PRICE;
  const layersCost = calculateLayersCost(config.layers) * PRICE_CONFIG.AREA_PRICE_FACTOR;
  const decorationCost = config.decorations * PRICE_CONFIG.DECORATION_PRICE;
  const shapeMultiplier = PRICE_CONFIG.SHAPE_MULTIPLIER[config.shape];
  const totalPrice = Math.round((basePrice + layersCost + decorationCost) * shapeMultiplier);

  return {
    basePrice,
    layersCost: Math.round(layersCost),
    decorationCost,
    shapeMultiplier,
    totalPrice: Math.max(500, Math.min(50000, totalPrice)),
  };
}

// ✅ Функция для получения рекомендаций по оптимизации цены
export function getPriceRecommendations(config: Partial<CakeConfig>): string[] {
  const recommendations: string[] = [];

  if (config.layers && config.layers.length > 5) {
    recommendations.push('Рассмотрите возможность уменьшения количества слоёв для снижения стоимости');
  }

  if (config.decorations && config.decorations > 10) {
    recommendations.push('Большое количество декораций значительно увеличивает стоимость');
  }

  if (config.shape === 'square') {
    recommendations.push('Квадратная форма на 10% дороже круглой');
  }

  const totalSize = config.layers?.reduce((sum, layer) => sum + layer.size, 0) || 0;
  if (totalSize > 150) {
    recommendations.push('Большой общий размер торта может значительно увеличить стоимость');
  }

  return recommendations;
}
