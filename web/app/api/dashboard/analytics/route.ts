import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

const supabase = getServerClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'daily', 'weekly', 'monthly'
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase.from('orders').select(`
      *,
      order_items(*),
      profiles(full_name)
    `);

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: orders, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;

    // Анализируем данные
    const analytics = {
      totalOrders: orders?.length || 0,
      totalRevenue: orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0,
      avgOrderValue: 0,
      ordersByStatus: {},
      ordersByDeliveryMethod: {},
      revenueByDay: {},
      topProducts: {},
      conversionRate: 0
    };

    // Средний чек
    if (analytics.totalOrders > 0) {
      analytics.avgOrderValue = analytics.totalRevenue / analytics.totalOrders;
    }

    // Заказы по статусам
    orders?.forEach(order => {
      analytics.ordersByStatus[order.status] = (analytics.ordersByStatus[order.status] || 0) + 1;
      analytics.ordersByDeliveryMethod[order.delivery_method] = (analytics.ordersByDeliveryMethod[order.delivery_method] || 0) + 1;

      const day = order.created_at.split('T')[0];
      analytics.revenueByDay[day] = (analytics.revenueByDay[day] || 0) + Number(order.total);

      order.order_items?.forEach(item => {
        analytics.topProducts[item.name_snapshot] = (analytics.topProducts[item.name_snapshot] || 0) + 1;
      });
    });

    // Топ товары
    const topProductsArray = Object.entries(analytics.topProducts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      ...analytics,
      topProducts: topProductsArray,
      period: { startDate, endDate, type }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
