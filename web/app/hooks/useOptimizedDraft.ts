// file: app/hooks/useOptimizedDraft.ts
'use client';
import { useRef, useState, useEffect } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { recordDraftHistory } from '@/lib/draftHistory';

export function useOptimizedDraft(userId?: string) {
  const [draft, setDraft] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const prevConfig = useRef<string>('');
  const debouncedConfig = useDebounce(draft?.config ?? {}, 30_000);

  const load = async () => {
    if (!userId) return;
    const res = await fetch(`/api/cake/draft?userId=${userId}`);
    const data = await res.json();
    setDraft(data.draft);
    prevConfig.current = JSON.stringify(data.draft?.config ?? {});
  };

  const save = async (config: any) => {
    const configStr = JSON.stringify(config);
    if (configStr === prevConfig.current) return;
    prevConfig.current = configStr;
    setSaving(true);
    try {
      // Обычное сохранение
      await fetch('/api/cake/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, config }),
      });
      // История (только если draft уже имеет id)
      if (draft?.id) {
        await recordDraftHistory({
          draftId: draft.id,
          userId,
          config,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    if (debouncedConfig) {
      save(debouncedConfig);
    }
  }, [debouncedConfig, userId]);

  return { draft, saving, load, setDraft };
}
