export class PriceCalculator {
  // Базовая цена за кг в зависимости от типа изделия
  private static basePrices = {
    tort: 1800,
    dessert: 1200,
    keks: 800
  };

  // Наценка за ярусы
  private static layersMultiplier = 1.15;

  // Наценка за эксклюзивные покрытия
  private static toppingMultiplier = {
    fondant: 1.0,
    cream: 0.9,
    chocolate: 1.1,
    buttercream: 1.0
  };

  // Наценка за событие
  private static eventMultiplier = {
    wedding: 1.3,
    birthday: 1.0,
    corporate: 1.2,
    anniversary: 1.1,
    kids: 1.0,
    other: 1.0
  };

  static calculateCakePrice(params: {
    type: 'tort' | 'dessert' | 'keks';
    weight: number;
    layers: number;
    fillings: number;
    topping: string;
    event: string;
    complexity?: 'simple' | 'medium' | 'complex';
  }): number {
    const { type, weight, layers, fillings, topping, event, complexity = 'medium' } = params;

    let basePrice = this.basePrices[type] * weight;

    // Наценка за слои
    if (layers > 1) {
      basePrice *= Math.pow(this.layersMultiplier, layers - 1);
    }

    // Наценка за покрытие
    basePrice *= this.toppingMultiplier[topping as keyof typeof this.toppingMultiplier] || 1.0;

    // Наценка за событие
    basePrice *= this.eventMultiplier[event as keyof typeof this.eventMultiplier] || 1.0;

    // Начинки (дополнительно за каждую сверх первой)
    if (fillings > 1) {
      basePrice += (fillings - 1) * 150;
    }

    // Сложность дизайна
    const complexityMultiplier = {
      simple: 1.0,
      medium: 1.2,
      complex: 1.5
    };
    basePrice *= complexityMultiplier[complexity];

    return Math.round(basePrice);
  }

  static calculateDeliveryPrice(method: string, distance?: number, weight?: number): number {
    switch (method) {
      case 'pickup':
        return 0;
      case 'courier':
        // Базовая стоимость + за км + за кг
        const baseCourier = 300;
        const perKm = 15;
        const perKg = 20;
        return Math.round(baseCourier + (distance || 5) * perKm + (weight || 1) * perKg);
      case 'sdek':
        // Расчет через API СДЭК
        return this.calculateSdekPrice(distance || 10, weight || 1);
      default:
        return 0;
    }
  }

  private static calculateSdekPrice(distance: number, weight: number): number {
    // Упрощенный расчет для демо
    const base = 250;
    const distanceRate = 8; // за км
    const weightRate = 25;  // за кг
    return Math.round(base + distance * distanceRate + weight * weightRate);
  }

  static applyDiscount(total: number, discount?: { percent?: number; amount?: number }): number {
    if (!discount) return total;

    let result = total;
    if (discount.percent) {
      result = result * (1 - discount.percent / 100);
    }
    if (discount.amount) {
      result = Math.max(0, result - discount.amount);
    }

    return Math.round(result);
  }

  static calculateBonusEarned(total: number, rate: number = 0.05): number {
    return Math.floor(total * rate);
  }

  static formatPrice(price: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  }
}
