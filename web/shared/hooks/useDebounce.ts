// file: shared/hooks/useDebounce.ts
'use client';
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
