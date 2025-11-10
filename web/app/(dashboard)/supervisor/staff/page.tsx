'use client';

import { useState, useEffect } from 'react';
import { getClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  phone: string;
  bonus_balance: number;
  created_at: string;
  last_active?: string;
  status: 'active' | 'inactive';
}

export default function StaffManagement() {
  const supabase = getClient();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ full_name: '', role: 'user', phone: '' });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['confectioner', 'manager', 'supervisor', 'admin']);
    setStaff(data || []);
    setLoading(false);
  };

  const addStaff = async () => {
    if (!newStaff.full_name || !newStaff.phone) {
      alert('Заполните все поля');
      return;
    }

    try {
      // В реальном проекте здесь был бы запрос на создание пользователя
      // и получение ID из auth.users
      const fakeId = '00000000-0000-0000-0000-' + Math.random().toString(16).substr(2, 12);

      const { error } = await supabase.from('profiles').insert([{
        id: fakeId,
        full_name: newStaff.full_name,
        role: newStaff.role,
        phone: newStaff.phone
      }]);

      if (error) throw error;

      alert('Сотрудник добавлен');
      setShowAddForm(false);
      setNewStaff({ full_name: '', role: 'user', phone: '' });
      loadStaff();
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      alert('Роль обновлена');
      loadStaff();
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Управление персоналом</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Отменить' : 'Добавить сотрудника'}
        </Button>
      </div>

      {showAddForm && (
        <Card style={{ marginBottom: '24px' }}>
          <CardHeader>
            <CardTitle>Добавить нового сотрудника</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label>ФИО</label>
                <Input
                  value={newStaff.full_name}
                  onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                  placeholder="Фамилия Имя Отчество"
                />
              </div>
              <div>
                <label>Роль</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="input"
                >
                  <option value="user">Клиент</option>
                  <option value="confectioner">Кондитер</option>
                  <option value="manager">Менеджер</option>
                  <option value="supervisor">Управляющий</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              <div>
                <label>Телефон</label>
                <Input
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'end' }}>
                <Button onClick={addStaff}>Добавить</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {staff.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <CardTitle>{member.full_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div><strong>Роль:</strong>
                  <select
                    value={member.role}
                    onChange={(e) => updateRole(member.id, e.target.value)}
                    className="input"
                    style={{ marginLeft: '8px', width: 'auto', display: 'inline-block' }}
                  >
                    <option value="user">Клиент</option>
                    <option value="confectioner">Кондитер</option>
                    <option value="manager">Менеджер</option>
                    <option value="supervisor">Управляющий</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>
                <div><strong>Телефон:</strong> {member.phone}</div>
                <div><strong>Бонусы:</strong> {member.bonus_balance} ₽</div>
                <div><strong>Добавлен:</strong> {formatDate(member.created_at)}</div>
                <div><strong>Статус:</strong>
                  <span className={`badge status-${member.status}`} style={{ marginLeft: '8px' }}>
                    {member.status === 'active' ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
