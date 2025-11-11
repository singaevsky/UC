// file: shared/lib/price/priceCalculator.ts
export type CakeConfig = {
  layers: Array<{
    type: 'biscuit' | 'cream' | 'topping';
    size: number; // см
  }>;
  shape: 'round' | 'square';
  decorations: number;
};

export function calculatePrice(cfg: CakeConfig): number {
  const basePrice = 1000; // база за любой торт
  const layerCost = cfg.layers.reduce((sum, layer) => {
    const area = Math.PI * (layer.size / 2) ** 2; // площадь круга
    const coefficient = layer.type === 'topping' ? 0.5 : 1;
    return sum + (area * coefficient) / 100; // условная стоимость
  }, 0);

  const shapeMultiplier = cfg.shape === 'square' ? 1.1 : 1.0;
  const decorationCost = cfg.decorations * 50;

  const total = (basePrice + layerCost + decorationCost) * shapeMultiplier;
  return Math.round(total);
}
