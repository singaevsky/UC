// file: shared/hooks/useDraftCake.ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { safeJsonParse } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// ✅ Типы для TypeScript
export interface DraftCake {
  id: string;
  user_id: string;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  access_count: number;
  status: 'draft' | 'active' | 'converted_to_order' | 'archived' | 'deleted';
  title?: string;
  description?: string;
  version: number;
}

interface UseDraftCakeReturn {
  draft: DraftCake | null;
  saving: boolean;
  loading: boolean;
  error: string | null;
  updateConfig: (config: Record<string, any>) => void;
  refetch: () => Promise<void>;
  clearError: () => void;
  retry: () => Promise<void>;
  saveNow: () => Promise<void>;
  deleteDraft: () => Promise<void>;
  isDirty: boolean;
}

// ✅ Хук для работы с черновиком торта
export function useDraftCake(userId?: string): UseDraftCakeReturn {
  const [draft, setDraft] = useState<DraftCake | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // ✅ Refs для управления жизненным циклом
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedConfigRef = useRef<string>('');
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // ✅ Дебаунс конфигурации для автосохранения (30 секунд)
  const debouncedConfig = useDebounce(draft?.config ?? {}, 30000);

  // ✅ Функция создания AbortController
  const createAbortController = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, []);

  // ✅ Функция загрузки черновика
  const loadDraft = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const controller = createAbortController();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/cake/draft?userId=${userId}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (!data || typeof data !== 'object') {
        throw new Error('Некорректный формат ответа сервера');
      }

      setDraft(data.draft);

      // Обновляем последний сохраненный конфиг
      if (data.draft?.config) {
        lastSavedConfigRef.current = JSON.stringify(data.draft.config);
        setIsDirty(false);
      }

      retryCountRef.current = 0; // Сброс счетчика повторов при успехе
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error loading draft:', err);
        const errorMessage = err.message || 'Ошибка загрузки черновика';
        setError(errorMessage);

        // Автоматический повтор при ошибках сети
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          setTimeout(() => {
            loadDraft();
          }, 1000 * retryCountRef.current); // Экспоненциальная задержка
        }
      }
    } finally {
      setLoading(false);
    }
  }, [userId, createAbortController]);

  // ✅ Функция сохранения черновика
  const saveDraft = useCallback(async (config: Record<string, any>) => {
    if (!userId) return;

    // Отменяем предыдущий таймаут
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Группируем множественные запросы в один (debounce эффект)
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      setError(null);

      try {
        const configString = JSON.stringify(config);

        // Проверяем, изменился ли конфиг
        if (configString === lastSavedConfigRef.current) {
          setSaving(false);
          return;
        }

        const payload = JSON.stringify({ userId, config });

        const res = await fetch('/api/cake/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (!data || typeof data !== 'object' || !data.draft) {
          throw new Error('Некорректный ответ сервера при сохранении');
        }

        setDraft(data.draft);
        lastSavedConfigRef.current = configString;
        setIsDirty(false);
        retryCountRef.current = 0; // Сброс счетчика повторов при успехе

        toast.success('Черновик сохранен', { duration: 2000 });
      } catch (err) {
        console.error('Error saving draft:', err);
        const errorMessage = err instanceof Error ? err.message : 'Ошибка сохранения';
        setError(errorMessage);

        // Повторная попытка при ошибках сети
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          setTimeout(() => {
            saveDraft(config);
          }, 2000 * retryCountRef.current);
        } else {
          toast.error('Не удалось сохранить черновик');
        }
      } finally {
        setSaving(false);
      }
    }, 500); // Задержка для группировки запросов
  }, [userId]);

  // ✅ Функция обновления конфигурации
  const updateConfig = useCallback((config: Record<string, any>) => {
    if (!config || typeof config !== 'object') {
      console.warn('Invalid config provided to updateConfig:', config);
      return;
    }

    setDraft(prev => {
      const next = prev ? { ...prev, config } : null;
      setIsDirty(true);
      return next;
    });
  }, []);

  // ✅ Функция принудительного сохранения
  const saveNow = useCallback(async () => {
    if (draft?.config) {
      await saveDraft(draft.config);
    }
  }, [draft?.config, saveDraft]);

  // ✅ Функция удаления черновика
  const deleteDraft = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await fetch(`/api/cake/draft?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      setDraft(null);
      lastSavedConfigRef.current = '';
      setIsDirty(false);
      setError(null);

      toast.success('Черновик удален');
    } catch (err) {
      console.error('Error deleting draft:', err);
      setError(err instanceof Error ? err.message : 'Ошибка удаления черновика');
      toast.error('Не удалось удалить черновик');
    }
  }, [userId]);

  // ✅ Функция очистки ошибки
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✅ Функция повтора загрузки
  const retry = useCallback(async () => {
    retryCountRef.current = 0;
    await loadDraft();
  }, [loadDraft]);

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
    if (debouncedConfig && userId && isDirty) {
      saveDraft(debouncedConfig);
    }
  }, [debouncedConfig, userId, isDirty, saveDraft]);

  // ✅ Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    draft,
    saving,
    loading,
    error,
    updateConfig,
    refetch: loadDraft,
    clearError,
    retry,
    saveNow,
    deleteDraft,
    isDirty,
  };
}

// ✅ Хук для работы с множественными черновиками
interface UseDraftsListReturn {
  drafts: DraftCake[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deleteDraft: (draftId: string) => Promise<void>;
  duplicateDraft: (draftId: string) => Promise<DraftCake | null>;
  getDraft: (draftId: string) => DraftCake | undefined;
}

export function useDraftsList(userId?: string): UseDraftsListReturn {
  const [drafts, setDrafts] = useState<DraftCake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDrafts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/cake/drafts?userId=${userId}`);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setDrafts(data.drafts || []);
      setError(null);
    } catch (err) {
      console.error('Error loading drafts list:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки списка черновиков');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const deleteDraft = useCallback(async (draftId: string) => {
    try {
      const res = await fetch(`/api/cake/draft/${draftId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      setDrafts(prev => prev.filter(d => d.id !== draftId));
      toast.success('Черновик удален');
    } catch (err) {
      console.error('Error deleting draft:', err);
      setError(err instanceof Error ? err.message : 'Ошибка удаления черновика');
      toast.error('Не удалось удалить черновик');
    }
  }, []);

  const duplicateDraft = useCallback(async (draftId: string): Promise<DraftCake | null> => {
    try {
      const originalDraft = drafts.find(d => d.id === draftId);
      if (!originalDraft) {
        throw new Error('Черновик не найден');
      }

      const duplicatedConfig = {
        ...originalDraft.config,
        title: `${originalDraft.title || 'Копия'} (копия)`,
      };

      const res = await fetch('/api/cake/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          config: duplicatedConfig
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.draft) {
        setDrafts(prev => [data.draft, ...prev]);
        toast.success('Черновик скопирован');
        return data.draft;
      }

      return null;
    } catch (err) {
      console.error('Error duplicating draft:', err);
      setError(err instanceof Error ? err.message : 'Ошибка копирования черновика');
      toast.error('Не удалось скопировать черновик');
      return null;
    }
  }, [drafts, userId]);

  const getDraft = useCallback((draftId: string) => {
    return drafts.find(d => d.id === draftId);
  }, [drafts]);

  // Загрузка черновиков при изменении userId
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  return {
    drafts,
    loading,
    error,
    refetch: loadDrafts,
    deleteDraft,
    duplicateDraft,
    getDraft,
  };
}
