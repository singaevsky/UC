'use client';

import { useState, useRef } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { animateAddToCart } from './animations/CartAnimation';
import { Analytics } from '@/lib/analytics';

interface CartButtonProps {
  productId: number;
  productName: string;
  price: number;
  className?: string;
}

export default function CartButton({ productId, productName, price, className = '' }: CartButtonProps) {
  const supabase = getClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cartIconRef = useRef<HTMLElement | null>(null);

  useState(() => {
    // Находим иконку корзины в шапке
    const cartIcon = document.querySelector('[data-cart-icon]') as HTMLElement;
    cartIconRef.current = cartIcon;
  });

  const addToCart = async () => {
    if (loading) return;

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('cart_items').insert({
      product_id: productId,
      quantity: 1,
      options: {}
    });

    setLoading(false);

    if (error) {
      alert('Ошибка добавления в корзину: ' + error.message);
      return;
    }

    // Анимация
    if (buttonRef.current && cartIconRef.current) {
      animateAddToCart(buttonRef.current, cartIconRef.current);
    }

    // Аналитика
    Analytics.trackAddToCart(productId, productName, price, user?.id);

    // Обновляем корзину
    router.refresh();
  };

  return (
    <button
      ref={buttonRef}
      className={`btn ${className}`}
      onClick={addToCart}
      disabled={loading}
    >
      {loading ? 'Добавляем...' : 'В корзину'}
    </button>
  );
}
