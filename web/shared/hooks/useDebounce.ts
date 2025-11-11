// file: shared/hooks/useDebounce.ts
'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Хук для дебаунса значений
 * @param value Значение для дебаунса
 * @param delay Задержка в миллисекундах
 * @returns Дебаунсированное значение
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Очищаем предыдущий таймаут
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Устанавливаем новый таймаут
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup функция
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Хук для дебаунса функций
 * @param callback Функция для дебаунса
 * @param delay Задержка в миллисекундах
 * @returns Дебаунсированная функция
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Обновляем ref callback при изменении
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Дебаунсированная функция
  const debouncedCallback = ((...args: Parameters<T>) => {
    // Очищаем предыдущий таймаут
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Устанавливаем новый таймаут
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }) as T;

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Хук для мгновенного и отложенного обновления
 * @param value Начальное значение
 * @param delay Задержка для отложенного обновления
 * @returns Кортеж с мгновенным и отложенным значениями и функцией обновления
 */
export function useInstantAndDelayedValue<T>(
  value: T,
  delay: number
): [T, T, (newValue: T) => void] {
  const [instantValue, setInstantValue] = useState<T>(value);
  const [delayedValue, setDelayedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInstantValue(value);

    // Очищаем предыдущий таймаут
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Устанавливаем таймаут для отложенного обновления
    timeoutRef.current = setTimeout(() => {
      setDelayedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  const updateValue = (newValue: T) => {
    setInstantValue(newValue);

    // Очищаем предыдущий таймаут
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Устанавливаем новый таймаут
    timeoutRef.current = setTimeout(() => {
      setDelayedValue(newValue);
    }, delay);
  };

  return [instantValue, delayedValue, updateValue];
}
