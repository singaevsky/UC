'use client';

import { useState, useEffect } from 'react';
import { getClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';

export default function ReportsPage() {
  const supabase = getClient();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadReports();
    loadAnalytics();
  }, [selectedPeriod]);

  const loadReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    setReports(data || []);
    setLoading(false);
  };

  const loadAnalytics = async () => {
    const now = new Date();
    let startDate = '';

    switch (selectedPeriod) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
    }

    const response = await fetch(`/api/dashboard/analytics?type=${selectedPeriod}&start_date=${startDate}`);
    const data = await response.json();
    setAnalytics(data);
  };

  const generateReport = async (type: string) => {
    const now = new Date();
    const endDate = now.toISOString();
    let startDate = '';

    switch (type) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
    }

    const { data: orders } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        profiles(full_name)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const report = {
      type,
      title: `Отчет за ${type === 'daily' ? 'сегодня' : type === 'weekly' ? 'неделю' : 'месяц'}`,
      data: {
        totalOrders: orders?.length || 0,
        totalRevenue: orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0,
        avgOrderValue: orders?.length ?
          orders.reduce((sum, order) => sum + Number(order.total), 0) / orders.length : 0,
        ordersByStatus: orders?.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
        periodStart: startDate,
        periodEnd: endDate
      }
    };

    const { data, error } = await supabase
      .from('reports')
      .insert([{
        type,
        title: report.title,
        data: report.data,
        period_start: startDate,
        period_end: endDate
      }])
      .select()
      .single();

    if (!error) {
      alert('Отчет создан');
      loadReports();
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      <div className="mb-4">
        <h1>Отчеты и аналитика</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <label>Период:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input"
            style={{ width: 'auto' }}
          >
            <option value="day">День</option>
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
          </select>
          <button className="btn" onClick={() => generateReport(selectedPeriod)}>
            Создать отчет
          </button>
        </div>
      </div>

      {analytics && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <Card>
            <CardHeader>
              <CardTitle>Всего заказов</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                {analytics.totalOrders}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Выручка</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {formatPrice(analytics.totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Средний чек</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {formatPrice(analytics.avgOrderValue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Конверсия</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                {analytics.conversionRate}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Топ товары */}
        {analytics?.topProducts && (
          <Card>
            <CardHeader>
              <CardTitle>Топ товары</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.topProducts.slice(0, 5).map((product: any, index: number) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{product.name}</span>
                    <span style={{ fontWeight: 'bold' }}>{product.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Статусы заказов */}
        {analytics?.ordersByStatus && (
          <Card>
            <CardHeader>
              <CardTitle>Заказы по статусам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                  <div key={status} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className={`status-${status}`}>{status}</span>
                    <span style={{ fontWeight: 'bold' }}>{count as number}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* История отчетов */}
      <Card style={{ marginTop: '24px' }}>
        <CardHeader>
          <CardTitle>История отчетов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="border-b pb-3" style={{ borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h4>{report.title}</h4>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                      {report.type} • {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button className="btn--outline">Скачать</button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
