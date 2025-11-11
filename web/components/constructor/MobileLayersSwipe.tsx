// file: components/constructor/MobileLayersSwipe.tsx
'use client';
import { useState, useRef, useEffect } from 'react';

export function MobileLayersSwipe({ layers }: { layers: Layer[] }) {
  // ... (код из предыдущего ответа) ...

  // Плавная анимация через CSS, а не JS
  useEffect(() => {
    containerRef.current?.style.setProperty('--slide-index', String(index));
  }, [index]);

  return (
    <div className="relative w-full h-64 overflow-hidden">
      <div
        className="flex transition-transform duration-300"
        style={{ transform: `translateX(calc(var(--slide-index) * -100%))` }}
      >
        {/* ... слои ... */}
      </div>
    </div>
  );
}
