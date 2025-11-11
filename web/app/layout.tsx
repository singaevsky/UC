// file: app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';                     // Tailwind + пользовательские стили
import LogRocket from '../lib/logrocket';   // инициализация LogRocket (один раз)
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';

/* -------------------------------------------------------------------------- */
/*                               Мета‑данные                                  */
/* -------------------------------------------------------------------------- */
export const metadata: Metadata = {
  title: {
    default: 'UC – Конструктор тортов',
    template: '%s | UC',
  },
  description:
    'Создайте уникальный торт с нашим интерактивным конструктором. Выбирайте форму, вкусы, декор и оформляйте заказ онлайн.',
  icons: {
    icon: '/favicon.ico',
  },
};

/* -------------------------------------------------------------------------- */
/*                                   Лейаут                                   */
/* -------------------------------------------------------------------------- */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        {/* Предзагрузка шрифтов */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased font-sans">
        {/* Регистрация Service Worker (только на клиенте) */}
        <ServiceWorkerRegister />

        {/* Основной контент страниц */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </main>

        {/* Футер (по желанию) */}
        <footer className="border-t border-slate-800 mt-10 py-6 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} UC. Все права защищены.
        </footer>
      </body>
    </html>
  );
}
