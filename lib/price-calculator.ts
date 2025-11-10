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

  static calculateCakePrice(params: {
    type: 'tort' | 'dessert' | 'keks';
    weight: number;
    layers: number;
    fillings: number;
    topping: string;
    complexity?: 'simple' | 'medium' | 'complex';
  }): number {
    const { type, weight, layers, fillings, topping, complexity = 'medium' } = params;

    let basePrice = this.basePrices[type] * weight;

    // Наценка за слои
    if (layers > 1) {
      basePrice *= Math.pow(this.layersMultiplier, layers - 1);
    }

    // Наценка за покрытие
    basePrice *= this.toppingMultiplier[topping as keyof typeof this.toppingMultiplier] || 1.0;

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
        return 300; // Базовая стоимость курьера
      case 'sdek':
        // Расчет через API СДЭК
        return this.calculateSdekPrice(distance || 10, weight || 1);
      default:
        return 0;
    }
  }

  private static calculateSdekPrice(distance: number, weight: number): number {
    // Упрощенный расчет для демо
    return Math.round(200 + distance * 10 + weight * 20);
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
}
