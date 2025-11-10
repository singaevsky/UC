'use client';

import { useState, useEffect } from 'react';
import { getClient } from '@/lib/supabase/client';

const statusColors: Record<string, string> = {
  'created': '#ff9800',
  'paid': '#4caf50',
  'preparing': '#2196f3',
  'ready': '#9c27b0',
  'delivered': '#4caf50',
  'cancelled': '#f44336',
  'refunded': '#757575'
};

export default function AdminOrders() {
  const supabase = getClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('orders').select(`
        *,
        order_items(*),
        profiles(full_name, phone)
      `).order('created_at', { ascending: false });
      setOrders(data || []);
      setLoading(false);
    })();
  }, []);

  const updateStatus = async (orderId: number, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      <h1>Заказы</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
        {orders.map(order => (
          <div key={order.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3>Заказ #{order.id}</h3>
                <p>Клиент: {order.profiles?.full_name || 'Гость'}</p>
                <p>Телефон: {order.profiles?.phone || 'Не указан'}</p>
                <p>Дата: {new Date(order.created_at).toLocaleString()}</p>
                <p>Сумма: {order.total} ₽</p>
                <p>Способ оплаты: {order.payment_method}</p>
                <p>Способ доставки: {order.delivery_method}</p>
              </div>
              <div>
                <select
                  value={order.status}
                  onChange={e => updateStatus(order.id, e.target.value)}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    background: statusColors[order.status],
                    color: 'white'
                  }}
                >
                  {['created','paid','preparing','ready','delivered','cancelled','refunded'].map(status => (
                    <option key={status} value={status} style={{ color: 'black', background: 'white' }}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <h4>Позиции:</h4>
              {order.order_items?.map((item: any) => (
                <div key={item.id} style={{ padding: '8px', background: '#f9f9f9', marginBottom: '4px' }}>
                  <span>{item.name_snapshot}</span> — {item.quantity} шт. — {item.price} ₽
                </div>
              ))}
            </div>

            {order.comments && (
              <div style={{ marginTop: 12 }}>
                <h4>Комментарий:</h4>
                <p>{order.comments}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
