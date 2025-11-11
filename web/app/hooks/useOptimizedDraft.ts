// file: app/hooks/useOptimizedDraft.ts
'use client';
import { useRef, useState } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';

export function useOptimizedDraft(userId?: string) {
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const prevConfig = useRef<string>('');
  const debouncedConfig = useDebounce(draft?.config ?? {}, 30_000);

  const save = async (config: any) => {
    const configStr = JSON.stringify(config);
    if (configStr === prevConfig.current) return;
    prevConfig.current = configStr;

    setSaving(true);
    try {
      await fetch('/api/cake/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, config }),
      });
    } finally {
      setSaving(false);
    }
  };

  // Загрузка
  const load = async () => {
    if (!userId) return;
    const res = await fetch(`/api/cake/draft?userId=${userId}`);
    const data = await res.json();
    setDraft(data.draft);
    prevConfig.current = JSON.stringify(data.draft?.config || {});
  };

  // Сохранение при изменении
  useEffect(() => {
    if (!userId) return;
    if (debouncedConfig) {
      save(debouncedConfig);
    }
  }, [debouncedConfig, userId]);

  return { draft, saving, load, setDraft };
}
