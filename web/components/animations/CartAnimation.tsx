'use client';

import { gsap } from 'gsap';

export function animateAddToCart(buttonElement: HTMLElement, cartIcon: HTMLElement) {
  // Анимация кнопки
  const tl = gsap.timeline();

  tl.to(buttonElement, {
    scale: 0.95,
    duration: 0.1,
    ease: "power2.in"
  })
  .to(buttonElement, {
    scale: 1,
    duration: 0.3,
    ease: "back.out(1.7)"
  });

  // Анимация иконки корзины
  const cartRect = cartIcon.getBoundingClientRect();
  const buttonRect = buttonElement.getBoundingClientRect();

  const clone = buttonElement.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.top = `${buttonRect.top}px`;
  clone.style.left = `${buttonRect.left}px`;
  clone.style.zIndex = '9999';
  clone.style.pointerEvents = 'none';
  clone.style.background = 'var(--color-accent)';
  clone.style.color = 'white';
  clone.style.borderRadius = '50%';
  clone.style.width = '40px';
  clone.style.height = '40px';
  clone.style.display = 'flex';
  clone.style.alignItems = 'center';
  clone.style.justifyContent = 'center';
  clone.innerHTML = '🛒';

  document.body.appendChild(clone);

  gsap.to(clone, {
    x: cartRect.left - buttonRect.left,
    y: cartRect.top - buttonRect.top,
    scale: 0.2,
    duration: 0.8,
    ease: "power2.inOut",
    onComplete: () => {
      clone.remove();
      // Анимация корзины
      gsap.fromTo(cartIcon,
        { scale: 1 },
        { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.inOut" }
      );
    }
  });
}
