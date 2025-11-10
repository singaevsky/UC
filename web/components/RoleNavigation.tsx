'use client';

import { useState, useEffect } from 'react';
import { getClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  roles: string[];
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Мой дашборд',
    href: '/dashboard',
    icon: '📊',
    roles: ['confectioner', 'manager', 'supervisor', 'admin']
  },
  {
    name: 'Кондитер',
    href: '/dashboard/confectioner',
    icon: '👨‍🍳',
    roles: ['confectioner', 'supervisor', 'admin']
  },
  {
    name: 'Менеджер',
    href: '/dashboard/manager',
    icon: '📋',
    roles: ['manager', 'supervisor', 'admin']
  },
  {
    name: 'Управляющий',
    href: '/dashboard/supervisor',
    icon: '👔',
    roles: ['supervisor', 'admin']
  },
  {
    name: 'Заказы',
    href: '/dashboard/supervisor/orders',
    icon: '📦',
    roles: ['manager', 'supervisor', 'admin']
  },
  {
    name: 'Отчеты',
    href: '/dashboard/supervisor/reports',
    icon: '📈',
    roles: ['supervisor', 'admin']
  },
  {
    name: 'Персонал',
    href: '/dashboard/supervisor/staff',
    icon: '👥',
    roles: ['supervisor', 'admin']
  },
  {
    name: 'Склад',
    href: '/dashboard/supervisor/warehouse',
    icon: '🏪',
    roles: ['manager', 'supervisor', 'admin']
  },
  {
    name: 'График',
    href: '/dashboard/supervisor/schedule',
    icon: '📅',
    roles: ['supervisor', 'admin']
  }
];

export default function RoleNavigation() {
  const supabase = getClient();
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setUserRole(profile?.role || 'user');
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div>Загрузка...</div>;

  if (!userRole || !['confectioner', 'manager', 'supervisor', 'admin'].includes(userRole)) {
    return null;
  }

  const availableItems = navigationItems.filter(item =>
    item.roles.includes(userRole) || item.roles.includes('admin')
  );

  return (
    <nav style={{
      background: 'var(--color-cream)',
      padding: '12px 0',
      marginBottom: '16px',
      borderBottom: '1px solid #eee'
    }}>
      <div className="container">
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {availableItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'transparent',
                color: 'var(--text)',
                textDecoration: 'none',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(123, 90, 60, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
