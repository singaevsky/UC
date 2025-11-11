// file: components/ServiceWorkerRegister.tsx
'use client';

import { useEffect } from 'react';

/**
 * Регистрирует Service Worker из /public/sw.js
 * – кеширует GET‑запросы к черновику и позволяет частичную работу офлайн.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const register = async () => {
        try {
          await navigator.serviceWorker.register('/sw.js');
          // При необходимости можно подписаться на обновления:
          // navigator.serviceWorker.addEventListener('message', (event) => { … });
        } catch (error) {
          console.error('SW registration failed:', error);
        }
      };
      register();
    }
  }, []);

  return null;
}
