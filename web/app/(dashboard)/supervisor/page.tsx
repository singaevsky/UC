import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { formatPrice, formatDate } from '@/lib/utils';
import FadeIn from '@/components/animations/FadeIn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Link from 'next/link';

export default async function SupervisorDashboard() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div className="card">Необходима авторизация</div>;
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || (profile.role !== 'supervisor' && profile.role !== 'admin')) {
    return <div className="card">Недостаточно прав доступа</div>;
  }

  // Получаем комплексную статистику
  const { data: totalStats } = await supabase.rpc('get_supervisor_stats');
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      *,
      profiles(full_name, phone),
      order_items(*)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: staffTasks } = await supabase
    .from('tasks')
    .select('*, profiles!tasks_assigned_to_fkey(full_name, role)')
    .in('status', ['pending', 'in_progress'])
    .order('priority', { ascending: false })
    .limit(10);

  const { data: warehouseOps } = await supabase
    .from('warehouse_operations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: revenueData } = await supabase
    .from('orders')
    .select('total, created_at, status')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  // Группируем выручку по дням
  const revenueByDay = revenueData?.reduce((acc, order) => {
    const day = order.created_at.split('T')[0];
    if (order.status === 'paid') {
      acc[day] = (acc[day] || 0) + Number(order.total);
    }
    return acc;
  }, {} as Record<string, number>) || {};

  const topRevenueDay = Object.entries(revenueByDay).reduce((max, [day, revenue]) =>
    revenue > max.revenue ? { day, revenue } : max,
    { day: '', revenue: 0 }
  );

  return (
    <FadeIn>
      <div className="mb-4">
        <h1>Панель управляющего</h1>
        <p>Добро пожаловать, {profile.full_name}! Обзор работы кондитерской за сегодня.</p>
      </div>

      {/* Ключевые метрики */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <CardHeader>
            <CardTitle>Всего заказов</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-accent)' }}>
              {totalStats?.total_orders || 0}
            </div>
            <p style={{ fontSize: '12px', color: '#666' }}>
              Сегодня: {totalStats?.today_orders || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Выручка</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {formatPrice(totalStats?.total_revenue || 0)}
            </div>
            <p style={{ fontSize: '12px', color: '#666' }}>
              Сегодня: {formatPrice(totalStats?.today_revenue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Активных задач</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2196f3' }}>
              {totalStats?.active_tasks || 0}
            </div>
            <p style={{ fontSize: '12px', color: '#666' }}>
              Выполнено: {totalStats?.completed_tasks || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Лучший день</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4caf50' }}>
              {topRevenueDay.day ? formatDate(topRevenueDay.day) : 'Нет данных'}
            </div>
            <p style={{ fontSize: '12px', color: '#666' }}>
              {formatPrice(topRevenueDay.revenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Эффективность</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#9c27b0' }}>
              {totalStats?.efficiency || 0}%
            </div>
            <p style={{ fontSize: '12px', color: '#666' }}>
              Выполнение задач
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* График и управление */}
        <div className="space-y-4">
          {/* Последние заказы */}
          <Card>
            <CardHeader>
              <CardTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Последние заказы
                <Link href="/dashboard/supervisor/orders" className="btn--outline" style={{ fontSize: '12px', padding: '4px 8px' }}>
                  Все заказы
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders?.slice(0, 10).map((order) => (
                  <div key={order.id} className="border-b pb-3" style={{ borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h5 style={{ margin: 0, fontSize: '14px' }}>
                          Заказ #{order.id} • {order.profiles?.full_name || 'Гость'}
                        </h5>
                        <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                          {formatDate(order.created_at)} • {order.delivery_method}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                          {order.order_items?.map(item => item.name_snapshot).join(', ')}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          {formatPrice(order.total)}
                        </div>
                        <div className={`badge status-${order.status}`}>
                          {order.status}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '6px', display: 'flex', gap: '4px' }}>
                      <Link
                        href={`/dashboard/supervisor/orders/${order.id}`}
                        className="btn--outline"
                        style={{ fontSize: '10px', padding: '2px 6px' }}
                      >
                        Детали
                      </Link>
                      <button className="btn--outline" style={{ fontSize: '10px', padding: '2px 6px' }}>
                        Изменить статус
                      </button>
                    </div>
                  </div>
                )) || <p>Заказов пока нет</p>}
              </div>
            </CardContent>
          </Card>

          {/* Складские операции */}
          <Card>
            <CardHeader>
              <CardTitle>Последние складские операции</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {warehouseOps?.map((op) => (
                  <div key={op.id} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #eee' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{op.product_name}</span>
                      <span style={{ fontSize: '10px', color: '#666', marginLeft: '8px' }}>
                        {op.operation_type} • {op.quantity} {op.unit}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      {op.total_cost ? formatPrice(Number(op.total_cost)) : ''}
                    </div>
                  </div>
                )) || <p>Операций пока нет</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Правая колонка - управление */}
        <div className="space-y-4">
          {/* Задачи сотрудников */}
          <Card>
            <CardHeader>
              <CardTitle>Задачи сотрудников</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staffTasks?.map((task) => (
                  <div key={task.id} className="p-3 border rounded" style={{ border: '1px solid #ddd', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h5 style={{ margin: 0, fontSize: '14px' }}>{task.title}</h5>
                        <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                          {task.description}
                        </p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#999' }}>
                          Исполнитель: {task.profiles?.full_name} ({task.profiles?.role})
                        </p>
                      </div>
                      <div className={`badge priority-${task.priority}`}>
                        {task.priority}
                      </div>
                    </div>
                  </div>
                )) || <p>Задач пока нет</p>}
              </div>
            </CardContent>
          </Card>

          {/* Быстрые действия */}
          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/dashboard/supervisor/reports" className="btn" style={{ width: '100%' }}>
                  Создать отчет
                </Link>
                <Link href="/dashboard/supervisor/warehouse" className="btn--outline" style={{ width: '100%' }}>
                  Управление складом
                </Link>
                <Link href="/dashboard/supervisor/staff" className="btn--outline" style={{ width: '100%' }}>
                  Управление персоналом
                </Link>
                <Link href="/dashboard/supervisor/schedule" className="btn--outline" style={{ width: '100%' }}>
                  График работы
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Ключевые показатели */}
          <Card>
            <CardHeader>
              <CardTitle>Ключевые показатели</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ fontSize: '12px' }}>Средний чек:</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    {totalStats?.avg_check ? formatPrice(totalStats.avg_check) : 'Нет данных'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontSize: '12px' }}>Время обработки:</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    {totalStats?.avg_processing_time || 'Нет данных'} мин
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontSize: '12px' }}>Рейтинг клиентов:</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4caf50' }}>
                    ⭐ {totalStats?.client_rating || 'Нет данных'}/5
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontSize: '12px' }}>Возвраты:</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: totalStats?.return_rate > 5 ? '#f44336' : '#4caf50' }}>
                    {totalStats?.return_rate || 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FadeIn>
  );
}
