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

/**
 * Хук для debounce с возможностью отмены
 * @param value Значение для дебаунса
 * @param delay Задержка в миллисекундах
 * @returns Кортеж с дебаунсированным значением и функцией отмены
 */
export function useCancellableDebounce<T>(
  value: T,
  delay: number
): [T, () => void] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return [debouncedValue, cancel];
}

/**
 * Хук для throttling значений
 * @param value Значение для throttle
 * @param limit Ограничение в миллисекундах
 * @returns Throttle-ированное значение
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Хук для throttle функций
 * @param callback Функция для throttle
 * @param limit Ограничение в миллисекундах
 * @returns Throttle-ированная функция
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const lastRan = useRef<number>(0);
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastRan.current >= limit) {
      savedCallback.current(...args);
      lastRan.current = now;
    }
  }) as T;
}

/**
 * Хук для debounce с leading и trailing вызовами
 * @param value Значение для дебаунса
 * @param delay Задержка в миллисекундах
 * @param options Опции (leading, trailing)
 * @returns Дебаунсированное значение
 */
export function useDebounceWithOptions<T>(
  value: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T {
  const { leading = false, trailing = true } = options;
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastCallTime = useRef<number>();

  useEffect(() => {
    const callNow = leading && !timeoutRef.current;
    const invoke = () => {
      setDebouncedValue(value);
    };

    if (callNow) {
      invoke();
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const lastCall = lastCallTime.current;
      lastCallTime.current = Date.now();

      if (trailing && (!lastCall || Date.now() - lastCall >= delay)) {
        invoke();
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, leading, trailing]);

  return debouncedValue;
}

/**
 * Хук для debounce с возможностью немедленного вызова
 * @param value Значение для дебаунса
 * @param delay Задержка в миллисекундах
 * @returns Кортеж с дебаунсированным значением и функцией flush
 */
export function useFlushableDebounce<T>(
  value: T,
  delay: number
): [T, () => void] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setDebouncedValue(value);
    }
  }, [value]);

  return [debouncedValue, flush];
}
