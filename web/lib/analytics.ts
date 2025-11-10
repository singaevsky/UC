export class Analytics {
  static async track(event: {
    userId?: string;
    type: string;
    data?: any;
  }) {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: event.userId,
          type: event.type,
          data: event.data,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // События e-commerce
  static trackAddToCart(productId: number, productName: string, price: number, userId?: string) {
    this.track({
      userId,
      type: 'add_to_cart',
      data: { productId, productName, price }
    });
  }

  static trackCheckout(userId: string, orderId: number, total: number) {
    this.track({
      userId,
      type: 'purchase',
      data: { orderId, total }
    });
  }

  static trackConstructorUsage(config: any) {
    this.track({
      type: 'constructor_usage',
      data: config
    });
  }
}
