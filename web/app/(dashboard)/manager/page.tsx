import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { formatPrice, formatDate } from '@/lib/utils';
import FadeIn from '@/components/animations/FadeIn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default async function ManagerDashboard() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div className="card">Необходима авторизация</div>;
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || (profile.role !== 'manager' && profile.role !== 'supervisor' && profile.role !== 'admin')) {
    return <div className="card">Недостаточно прав доступа</div>;
  }

  // Получаем статистику
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const { data: stats } = await supabase.rpc('get_manager_stats');
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      *,
      profiles(full_name, phone),
      order_items(*)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to', user.id)
    .in('status', ['pending', 'in_progress'])
    .order('priority', { ascending: false });

  const { data: followUps } = await supabase
    .from('client_communications')
    .select('*, orders!inner(id, total, created_at), profiles!orders_user_id_fkey(full_name, phone)')
    .eq('manager_id', user.id)
    .eq('follow_up_required', true)
    .lte('follow_up_date', new Date().toISOString())
    .order('follow_up_date', { ascending: true });

  return (
    <FadeIn>
      <div className="mb-4">
        <h1>Панель менеджера</h1>
        <p>Добро пожаловать, {profile.full_name}!</p>
      </div>

      {/* Статистика */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <CardHeader>
            <CardTitle>Заказы сегодня</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-accent)' }}>
              {stats?.today_orders || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ожидают обработки</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-gold)' }}>
              {stats?.pending_orders || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Выручка сегодня</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {formatPrice(stats?.today_revenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Активные задачи</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196f3' }}>
              {tasks?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Последние заказы */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Последние заказы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders?.map((order) => (
                  <div key={order.id} className="border-b pb-3" style={{ borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h4>Заказ #{order.id}</h4>
                        <p style={{ color: '#666' }}>
                          {order.profiles?.full_name || 'Гость'} • {formatDate(order.created_at)}
                        </p>
                        <p style={{ fontSize: '14px', color: '#999' }}>
                          {order.order_items?.map(item => item.name_snapshot).join(', ')}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                          {formatPrice(order.total)}
                        </div>
                        <div className={`badge status-${order.status}`}>
                          {order.status}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <button className="btn--outline" style={{ fontSize: '12px', padding: '4px 8px' }}>
                        Связаться
                      </button>
                      <button className="btn--outline" style={{ fontSize: '12px', padding: '4px 8px' }}>
                        Детали
                      </button>
                    </div>
                  </div>
                )) || <p>Заказов пока нет</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Правая колонка */}
        <div className="space-y-4">
          {/* Мои задачи */}
          <Card>
            <CardHeader>
              <CardTitle>Мои задачи</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks?.map((task) => (
                  <div key={task.id} className="p-3 border rounded" style={{ border: '1px solid #ddd', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h5 style={{ margin: 0, fontSize: '14px' }}>{task.title}</h5>
                        <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>{task.description}</p>
                        {task.due_date && (
                          <p style={{ margin: 0, fontSize: '11px', color: task.priority === 'urgent' ? '#f44336' : '#666' }}>
                            До: {formatDate(task.due_date)}
                          </p>
                        )}
                      </div>
                      <div className={`badge priority-${task.priority}`}>
                        {task.priority}
                      </div>
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <button className="btn--outline" style={{ fontSize: '12px', padding: '4px 8px' }}>
                        Выполнить
                      </button>
                    </div>
                  </div>
                )) || <p>Задач нет</p>}
              </div>
            </CardContent>
          </Card>

          {/* Требующие внимания */}
          <Card>
            <CardHeader>
              <CardTitle>Требуют внимания</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {followUps?.map((com) => (
                  <div key={com.id} className="p-3 border rounded" style={{ border: '1px solid #f44336', borderRadius: '8px', background: '#fff3f3' }}>
                    <h5 style={{ margin: 0, fontSize: '14px' }}>
                      {com.profiles?.full_name || 'Клиент'}
                    </h5>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                      Заказ #{com.order_id} • {com.type}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#f44336' }}>
                      Связаться до: {formatDate(com.follow_up_date!)}
                    </p>
                    <button className="btn" style={{ fontSize: '12px', padding: '4px 8px', marginTop: '8px' }}>
                      Выполнить
                    </button>
                  </div>
                )) || <p>Всё под контролем</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FadeIn>
  );
}
