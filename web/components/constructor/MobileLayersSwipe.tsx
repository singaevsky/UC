// file: components/constructor/MobileLayersSwipe.tsx
'use client';
import { useState, useRef, useEffect } from 'react';

type Layer = { id: string; imageUrl: string; title: string };

export function MobileLayersSwipe({ layers }: { layers: Layer[] }) {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Устанавливаем CSS-переменную для плавной анимации
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--slide-index', String(index));
    }
  }, [index]);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const diff = e.touches[0].clientX - startX.current;
    const threshold = 40;
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && index > 0) setIndex(i => i - 1);
      else if (diff < 0 && index < layers.length - 1) setIndex(i => i + 1);
      startX.current = null;
    }
  };

  const onTouchEnd = () => {
    startX.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-64 overflow-hidden touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex h-full transition-transform duration-300 ease-out will-change-transform"
        style={{
          transform: `translateX(calc(-1 * var(--slide-index) * 100%))`,
        }}
      >
        {layers.map((layer, i) => (
          <div key={layer.id} className="w-full flex-shrink-0 flex items-center justify-center">
            <img
              src={layer.imageUrl}
              alt={layer.title}
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
            />
          </div>
        ))}
      </div>
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
        {layers.map((_, i) => (
          <button
            key={i}
            className={`w-2 h-2 rounded-full ${i === index ? 'bg-blue-600' : 'bg-gray-300'}`}
            onClick={() => setIndex(i)}
            aria-label={`Слой ${i+1}`}
          />
        ))}
      </div>
    </div>
  );
}
