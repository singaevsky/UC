// file: components/constructor/MobileLayersSwipe.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export interface Layer {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
}

interface MobileLayersSwipeProps {
  layers: Layer[];
  className?: string;
  onLayerChange?: (index: number) => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export function MobileLayersSwipe({
  layers,
  className = '',
  onLayerChange,
  autoPlay = false,
  autoPlayInterval = 5000,
}: MobileLayersSwipeProps) {
  // ✅ Состояние с правильной типизацией
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartTime = useRef<number>(0);
  const touchStartX = useRef<number>(0);

  // ✅ Оптимизированная функция перехода к слайду
  const goToSlide = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, layers.length - 1));
    setCurrentIndex(clampedIndex);
    onLayerChange?.(clampedIndex);
  }, [layers.length, onLayerChange]);

  // ✅ Следующий/предыдущий слайд
  const nextSlide = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  // ✅ Автопрокрутка
  useEffect(() => {
    if (!autoPlay || layers.length <= 1) return;

    const interval = setInterval(() => {
      if (!isDragging) {
        nextSlide();
      }
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, isDragging, nextSlide, layers.length]);

  // ✅ Обработчики касаний
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartTime.current = Date.now();
    touchStartX.current = e.touches[0].clientX;
    setStartX(e.touches[0].clientX);
    setIsDragging(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    const diffPercent = (diff / (containerRef.current?.offsetWidth || 1)) * 100;

    setDragOffset(diffPercent);

    // Определяем, что это свайп, а не тап
    if (Math.abs(diff) > 5) {
      setIsDragging(true);
    }

    // Предотвращаем скролл страницы во время свайпа
    if (Math.abs(diff) > 10) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (startX === null) return;

    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime.current;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - startX;
    const diffPercent = (diff / (containerRef.current?.offsetWidth || 1)) * 100;

    // Определяем направление свайпа
    const isQuickTap = touchDuration < 300 && Math.abs(diff) < 20;
    const isSignificantSwipe = Math.abs(diffPercent) > 20;

    if (isQuickTap) {
      // Быстрый тап - переключаем на следующий слайд
      if (diff > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    } else if (isSignificantSwipe) {
      // Значительный свайп
      if (diff > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }

    // Сбрасываем состояние
    setStartX(null);
    setDragOffset(0);
    setIsDragging(false);
    touchStartX.current = null;
  }, [startX, nextSlide, prevSlide]);

  // ✅ Обработчики мыши (для десктопа)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (startX === null) return;

    const diff = e.clientX - startX;
    const diffPercent = (diff / (containerRef.current?.offsetWidth || 1)) * 100;
    setDragOffset(diffPercent);
  }, [startX]);

  const handleMouseUp = useCallback(() => {
    if (Math.abs(dragOffset) > 20) {
      if (dragOffset > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }

    setStartX(null);
    setDragOffset(0);
    setIsDragging(false);
  }, [dragOffset, nextSlide, prevSlide]);

  // ✅ Клавиатурная навигация
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // ✅ Обработка видимости (пауза автопрокрутки)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsDragging(true);
      } else {
        setIsDragging(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ✅ Безопасный рендеринг
  if (!layers || layers.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-500">Нет слоёв для отображения</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden touch-pan-y select-none ${className}`}
      style={{ userSelect: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      role="region"
      aria-label="Галерея слоёв торта"
    >
      {/* ✅ Основная область слайдов */}
      <div
        className="flex h-full transition-transform duration-300 ease-out will-change-transform"
        style={{
          transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}%))`,
        }}
      >
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className="w-full flex-shrink-0 flex items-center justify-center p-4"
            role="group"
            aria-roledescription="slide"
            aria-label={`Слой ${index + 1} из ${layers.length}: ${layer.title}`}
          >
            <div className="text-center max-w-sm">
              <img
                src={layer.imageUrl}
                alt={layer.title}
                className="w-full h-48 object-contain mb-4 rounded-lg shadow-sm"
                draggable={false}
                loading="lazy"
              />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {layer.title}
              </h3>
              {layer.description && (
                <p className="text-sm text-gray-600">
                  {layer.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Индикаторы слайдов */}
      {layers.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {layers.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                index === currentIndex
                  ? 'bg-blue-600 scale-110'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Перейти к слайду ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}

      {/* ✅ Стрелки навигации */}
      {layers.length > 1 && (
        <>
          <button
            className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={prevSlide}
            disabled={currentIndex === 0}
            aria-label="Предыдущий слой"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              currentIndex === layers.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={nextSlide}
            disabled={currentIndex === layers.length - 1}
            aria-label="Следующий слой"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* ✅ Счётчик слайдов */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full">
        {currentIndex + 1} / {layers.length}
      </div>

      {/* ✅ Прогресс-бар для автопрокрутки */}
      {autoPlay && layers.length > 1 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-100 ease-linear"
            style={{
              width: `${((Date.now() % autoPlayInterval) / autoPlayInterval) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
}
