// file: lib/utils.ts (фрагмент)

// ✅ Безопасная работа с localStorage
export const localStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      if (typeof value !== 'string') {
        throw new Error('Value must be a string');
      }
      window.localStorage.setItem(key, value);
    } catch {
      // Игнорируем ошибки
    }
  },
  getJSON: <T>(key: string, fallback: T): T => {
    const item = localStorage.getItem(key);
    if (!item) return fallback;

    try {
      const parsed = JSON.parse(item);
      return parsed;
    } catch {
      return fallback;
    }
  },
  setJSON: (key: string, value: any): void => {
    try {
      const stringValue = JSON.stringify(value);
      localStorage.setItem(key, stringValue);
    } catch {
      // Игнорируем ошибки сериализации
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Игнорируем ошибки
    }
  },
};

// ✅ Безопасное чтение JSON
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    const parsed = JSON.parse(json);
    return parsed;
  } catch {
    return fallback;
  }
}
