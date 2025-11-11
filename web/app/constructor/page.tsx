// file: app/constructor/page.tsx (фрагмент)
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { calculatePrice } from '@/shared/lib/price/priceCalculator';
import { useDraftCake } from '@/shared/hooks/useDraftCake';
import { MobileLayersSwipe } from '@/components/constructor/MobileLayersSwipe';
import { useMediaQuery } from '@/lib/utils';
import { safeJsonParse } from '@/lib/utils';

// ✅ Безопасное получение draftId из URL
function getDraftIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const url = new URL(window.location.href);
    const draftId = url.searchParams.get('draftId');

    // ✅ Валидация UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (draftId && uuidRegex.test(draftId)) {
      return draftId;
    }

    return null;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}

// ✅ Безопасная загрузка конфигурации из localStorage
function loadConfigFromStorage(): Record<string, any> | null {
  try {
    const savedConfig = localStorage.getItem('cake-config');
    if (!savedConfig) return null;

    const parsed = safeJsonParse(savedConfig, null);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('Error loading config from storage:', error);
    return null;
  }
}

export default function ConstructorPage() {
  const { user, loading: userLoading } = useUser();
  const { draft, saving, updateConfig } = useDraftCake(user?.id);

  const [localConfig, setLocalConfig] = useState<Record<string, any>>({});
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const draftId = getDraftIdFromUrl();

  // ✅ Безопасная инициализация конфигурации
  useEffect(() => {
    // Пытаемся загрузить сохраненную конфигурацию
    const savedConfig = loadConfigFromStorage();
    if (savedConfig) {
      setLocalConfig(savedConfig);
    }

    // Загружаем черновик если есть
    if (draft && !localConfig) {
      setLocalConfig(draft.config || {});
    }

    if (user !== undefined) {
      setLoading(false);
    }
  }, [draft, user, localConfig]);

  // ✅ Безопасное сохранение конфигурации
  const handleConfigChange = (key: string, value: any) => {
    // ✅ Валидация входных данных
    if (key === null || key === undefined) {
      console.warn('Config key is invalid:', key);
      return;
    }

    const nextConfig = { ...localConfig, [key]: value };
    setLocalConfig(nextConfig);

    // Сохраняем в localStorage с обработкой ошибок
    try {
      const configString = JSON.stringify(nextConfig);
      if (configString.length < 100000) { // 100KB limit
        localStorage.setItem('cake-config', configString);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    }

    updateConfig(nextConfig);
  };

  // ✅ Безопасный импорт конфигурации из JSON файла
  const importConfigFromFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = safeJsonParse(text, null);

      if (parsed && typeof parsed === 'object') {
        setLocalConfig(parsed);
        updateConfig(parsed);
      } else {
        throw new Error('Invalid config format');
      }
    } catch (error) {
      console.error('Failed to import config:', error);
      alert('Некорректный файл конфигурации');
    }
  }, [updateConfig]);

  // ✅ Экспорт конфигурации в JSON файл
  const exportConfig = useCallback(() => {
    try {
      const configString = JSON.stringify(localConfig, null, 2);
      const blob = new Blob([configString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `cake-config-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export config:', error);
      alert('Ошибка при экспорте конфигурации');
    }
  }, [localConfig]);

  // ... остальной код компонента

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Конструктор тортов</h1>

      {/* ✅ Добавляем кнопки импорта/экспорта */}
      <div className="mb-6">
        <input
          type="file"
          accept=".json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importConfigFromFile(file);
          }}
          className="hidden"
          id="config-import"
        />
        <label htmlFor="config-import" className="btn-secondary cursor-pointer mr-2">
          Импорт конфигурации
        </label>
        <button onClick={exportConfig} className="btn-secondary">
          Экспорт конфигурации
        </button>
      </div>

      {/* ... остальной UI ... */}
    </div>
  );
}
