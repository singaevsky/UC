'use client';

import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { getClient } from '@/lib/supabase/client';

export default function Header({ userEmail }: { userEmail: string | null }) {
  const supabase = getClient();
  const [auth, setAuth] = useState(!!userEmail);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => setAuth(!!userEmail), [userEmail]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('cart_items').select('quantity');
      const count = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartCount(count);
    })();
  }, [userEmail]);

  return (
    <header style={{ background: 'var(--color-cream)', padding: '12px 0', marginBottom: 16 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" className="logo" style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-accent)' }}>
          Уездный кондитер
        </Link>
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/catalog">Каталог</Link>
          <Link href="/constructor">Конструктор</Link>
          <Link href="/promos">Акции</Link>
          <Link href="/blog">Блог</Link>
          <Link href="/delivery">Доставка</Link>
          <Link href="/contacts">Контакты</Link>
          <Link href="/reviews">Отзывы</Link>
          <Link href="/gallery">Галерея</Link>
          <Link href="/faq">FAQ</Link>

          {/* Корзина */}
          <Link href="/cart" data-cart-icon style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            🛒
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -8,
                right: -8,
                background: 'var(--color-accent)',
                color: 'white',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 'bold'
              }}>
                {cartCount}
              </span>
            )}
          </Link>

          {auth ? (
            <>
              <Link href="/account">Личный кабинет</Link>
              <button
                className="btn--outline"
                onClick={async () => {
                  await supabase.auth.signOut();
                  location.reload();
                }}
              >
                Выйти
              </button>
            </>
          ) : (
            <Link className="btn" href="/auth">Войти</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
