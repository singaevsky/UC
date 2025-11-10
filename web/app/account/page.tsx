import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { formatDateTime, formatPrice } from '@/lib/utils';
import FadeIn from '@/components/animations/FadeIn';

export default async function AccountPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return (
    <FadeIn>
      <div className="card">
        <h1>Личный кабинет</h1>
        <p>Войдите, чтобы посмотреть личный кабинет.</p>
      </div>
    </FadeIn>
  );

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const { data: orders } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  const { data: transactions } = await supabase.from('bonus_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

  return (
    <FadeIn>
      <div className="grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <div className="card">
          <h2>Профиль</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Имя:</strong> {profile?.full_name || 'Не указано'}</p>
          <p><strong>Телефон:</strong> {profile?.phone || 'Не указан'}</p>
          <p><strong>Бонусы:</strong> {profile?.bonus_balance || 0} ₽</p>
        </div>

        <div>
          <div className="card mb-3">
            <h2>Заказы</h2>
            {(orders || []).map(o => (
              <div key={o.id} className="card" style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div><strong>Заказ #{o.id}</strong></div>
                    <div className={`status-${o.status}`}>{o.status}</div>
                    <div style={{ color: '#666' }}>{formatDateTime(o.created_at)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>{formatPrice(o.total)}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{o.payment_method}</div>
                  </div>
                </div>
              </div>
            ))}
            {(!orders || orders.length === 0) && <p>Заказов пока нет</p>}
          </div>

          <div className="card">
            <h2>Бонусные операции</h2>
            {(transactions || []).map(t => (
              <div key={t.id} className="card" style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div>{t.type === 'earn' ? 'Начислено' : t.type === 'spend' ? 'Потрачено' : 'Корректировка'}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{formatDateTime(t.created_at)}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: t.type === 'earn' ? 'green' : 'red' }}>
                    {t.type === 'earn' ? '+' : '-'}{t.amount} ₽
                  </div>
                </div>
              </div>
            ))}
            {(!transactions || transactions.length === 0) && <p>Операций пока нет</p>}
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
