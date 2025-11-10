import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { formatDate, formatDateTime } from '@/lib/utils';
import FadeIn from '@/components/animations/FadeIn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default async function ConfectionerDashboard() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div className="card">Необходима авторизация</div>;
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || (profile.role !== 'confectioner' && profile.role !== 'supervisor' && profile.role !== 'admin')) {
    return <div className="card">Недостаточно прав доступа</div>;
  }

  // Получаем статистику для кондитера
  const { data: myTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to', user.id)
    .in('status', ['pending', 'in_progress'])
    .order('priority', { ascending: false });

  const { data: productionOrders } = await supabase
    .from('order_items')
    .select(`
      *,
      orders!inner(
        id,
        status,
        created_at,
        total,
        delivery_method,
        address,
        profiles!orders_user_id_fkey(full_name, phone)
      ),
      production_stages(*)
    `)
    .in('orders.status', ['paid', 'preparing'])
    .order('orders.created_at', { ascending: true });

  const { data: completedToday } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to', user.id)
    .eq('status', 'completed')
    .gte('completed_at', new Date().toISOString().split('T')[0]);

  const { data: inProgressStages } = await supabase
    .from('production_stages')
    .select('*')
    .eq('assigned_to', user.id)
    .in('status', ['in_progress', 'quality_check'])
    .order('started_at', { ascending: false });

  return (
    <FadeIn>
      <div className="mb-4">
        <h1>Панель кондитера</h1>
        <p>Здравствуйте, {profile.full_name}! Сегодня у вас {inProgressStages?.length || 0} заказов в работе.</p>
      </div>

      {/* Статистика */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <CardHeader>
            <CardTitle>В работе</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196f3' }}>
              {myTasks?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Готово сегодня</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4caf50' }}>
              {completedToday?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Этапов в процессе</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff9800' }}>
              {inProgressStages?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>На проверке</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#9c27b0' }}>
              {inProgressStages?.filter(s => s.status === 'quality_check').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Заказы на изготовление */}
        <Card>
          <CardHeader>
            <CardTitle>Заказы на изготовление</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productionOrders?.map((item) => (
                <div key={item.id} className="border rounded p-4" style={{ border: '1px solid #ddd', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h4>Заказ #{item.orders.id}</h4>
                    <span className={`badge status-${item.orders.status}`}>
                      {item.orders.status}
                    </span>
                  </div>

                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                    <strong>Изделие:</strong> {item.name_snapshot}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                    <strong>Клиент:</strong> {item.orders.profiles?.full_name || 'Гость'}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                    <strong>Телефон:</strong> {item.orders.profiles?.phone || 'Не указан'}
                  </p>

                  {item.cake_design && (
                    <div style={{ margin: '8px 0', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <strong>Параметры торта:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '16px', fontSize: '12px' }}>
                        {item.cake_design.event && <li>Событие: {item.cake_design.event}</li>}
                        {item.cake_design.form && <li>Форма: {item.cake_design.form}</li>}
                        {item.cake_design.layers && <li>Ярусы: {item.cake_design.layers}</li>}
                        {item.cake_design.fillings && <li>Начинки: {item.cake_design.fillings.join(', ')}</li>}
                        {item.cake_design.topping && <li>Покрытие: {item.cake_design.topping}</li>}
                        {item.cake_design.colors && <li>Цвета: {item.cake_design.colors.join(', ')}</li>}
                        {item.cake_design.date && <li>Дата события: {item.cake_design.date}</li>}
                        {item.cake_design.name && <li>Надпись: {item.cake_design.name}</li>}
                        {item.cake_design.comments && <li>Комментарии: {item.cake_design.comments}</li>}
                      </ul>
                    </div>
                  )}

                  <div style={{ marginTop: '8px' }}>
                    <strong>Этапы производства:</strong>
                    <div style={{ marginTop: '4px' }}>
                      {item.production_stages?.map((stage) => (
                        <div key={stage.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          margin: '4px 0',
                          fontSize: '12px'
                        }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: stage.status === 'completed' ? '#4caf50' :
                                       stage.status === 'in_progress' ? '#2196f3' :
                                       stage.status === 'quality_check' ? '#ff9800' : '#ddd'
                          }} />
                          <span style={{
                            textDecoration: stage.status === 'completed' ? 'line-through' : 'none',
                            color: stage.status === 'completed' ? '#666' : '#000'
                          }}>
                            {stage.stage_name}
                          </span>
                          {stage.started_at && (
                            <span style={{ color: '#666', fontSize: '10px' }}>
                              {formatDateTime(stage.started_at)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <button className="btn" style={{ fontSize: '12px', padding: '4px 8px' }}>
                      Начать этап
                    </button>
                    <button className="btn--outline" style={{ fontSize: '12px', padding: '4px 8px' }}>
                      Добавить заметку
                    </button>
                  </div>
                </div>
              )) || <p>Заказов на изготовление нет</p>}
            </div>
          </CardContent>
        </Card>

        {/* Мои задачи и этапы */}
        <div className="space-y-4">
          {/* Мои задачи */}
          <Card>
            <CardHeader>
              <CardTitle>Мои задачи</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myTasks?.map((task) => (
                  <div key={task.id} className="p-3 border rounded" style={{ border: '1px solid #ddd', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h5 style={{ margin: 0, fontSize: '14px' }}>{task.title}</h5>
                        <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>{task.description}</p>
                        {task.due_date && (
                          <p style={{ margin: 0, fontSize: '11px', color: task.priority === 'urgent' ? '#f44336' : '#666' }}>
                            Выполнить до: {formatDate(task.due_date)}
                          </p>
                        )}
                      </div>
                      <div className={`badge priority-${task.priority}`}>
                        {task.priority}
                      </div>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <button className="btn" style={{ fontSize: '12px', padding: '4px 8px' }}>
                        Выполнить
                      </button>
                    </div>
                  </div>
                )) || <p>Задач нет</p>}
              </div>
            </CardContent>
          </Card>

          {/* Этапы в процессе */}
          <Card>
            <CardHeader>
              <CardTitle>Активные этапы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inProgressStages?.map((stage) => (
                  <div key={stage.id} className="p-3 border rounded" style={{ border: '1px solid #2196f3', borderRadius: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '14px' }}>{stage.stage_name}</h5>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                      Заказ #{stage.order_item_id}
                    </p>
                    {stage.started_at && (
                      <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>
                        Начато: {formatDateTime(stage.started_at)}
                      </p>
                    )}
                    <div style={{ marginTop: '8px' }}>
                      <button className="btn" style={{ fontSize: '12px', padding: '4px 8px' }}>
                        Завершить
                      </button>
                    </div>
                  </div>
                )) || <p>Активных этапов нет</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FadeIn>
  );
}
