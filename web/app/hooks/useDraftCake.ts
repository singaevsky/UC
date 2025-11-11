// file: app/hooks/useDraftCake.ts
'use client';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { supabase } from '@/lib/supabaseClient';

type Draft = {
  id: string;
  user_id: string;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export function useDraftCake(userId: string | undefined) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const debouncedConfig = useDebounce(draft?.config ?? {}, 30_000);

  // Загружаем черновик
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const res = await fetch(`/api/cake/draft?userId=${userId}`);
      const json = await res.json();
      setDraft(json.draft);
    })();
  }, [userId]);

  // Автосохранение
  useEffect(() => {
    if (!userId || !debouncedConfig) return;
    setSaving(true);
    (async () => {
      await fetch('/api/cake/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, config: debouncedConfig }),
      });
      setSaving(false);
    })();
  }, [debouncedConfig, userId]);

  const updateConfig = (config: Record<string, any>) => {
    setDraft(prev => (prev ? { ...prev, config } : null));
  };

  return { draft, saving, updateConfig };
}
