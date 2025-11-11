// file: shared/hooks/useDraftCake.ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { supabase } from '@/lib/supabaseClient';

export interface DraftCake {
  id: string;
  user_id: string;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface UseDraftCakeReturn {
  draft: DraftCake | null;
  saving: boolean;
  updateConfig: (config: Record<string, any>) => void;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDraftCake(userId?: string): UseDraftCakeReturn {
  const [draft, setDraft] = useState<DraftCake | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Дебаунс конфигурации для автосохранения
  const debouncedConfig = useDebounce(draft?.config ?? {}, 30_000);

  // ✅ Функция загрузки черновика
  const loadDraft = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Отменяем предыдущий запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/cake/draft?userId=${userId}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setDraft(data.draft);

      // Устанавливаем конфигурацию если есть черновик
      if (data.draft?.config) {
        setDraft(prev => prev ? { ...prev, config: data.draft.config } : null);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error loading draft:', err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ✅ Функция сохранения черновика
  const saveDraft = useCallback(async (config: Record<string, any>) => {
    if (!userId) return;

    // Отменяем предыдущий таймаут
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Откладываем сохранение на 500мс для группировки запросов
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      setError(null);

      try {
        const res = await fetch('/api/cake/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, config }),
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setDraft(data.draft);
      } catch (err) {
        console.error('Error saving draft:', err);
        setError(err instanceof Error ? err.message : 'Ошибка сохранения');
      } finally {
        setSaving(false);
      }
    }, 500);
  }, [userId]);

  // ✅ Функция обновления конфигурации
  const updateConfig = useCallback((config: Record<string, any>) => {
    setDraft(prev => prev ? { ...prev, config } : null);
    saveDraft(config);
  }, [saveDraft]);

  // ✅ Загрузка черновика при изменении userId
  useEffect(() => {
    loadDraft();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [loadDraft]);

  // ✅ Автосохранение при изменении конфигурации
  useEffect(() => {
    if (debouncedConfig && userId) {
      saveDraft(debouncedConfig);
    }
  }, [debouncedConfig, userId, saveDraft]);

  // ✅ Функция перезагрузки
  const refetch = useCallback(async () => {
    await loadDraft();
  }, [loadDraft]);

  return {
    draft,
    saving,
    updateConfig,
    loading,
    error,
    refetch
  };
}
