// file: app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '../lib/logrocket';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UC - Конструктор тортов',
  description: 'Создай уникальный торт своей мечты',
  keywords: ['торт', 'конструктор', 'выпечка', 'дизайн торта'],
  authors: [{ name: 'UC Team' }],
  openGraph: {
    title: 'UC - Конструктор тортов',
    description: 'Создай уникальный торт своей мечты',
    type: 'website',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UC - Конструктор тортов',
    description: 'Создай уникальный торт своей мечты',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <header className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <a href="/" className="text-xl font-bold text-gray-900">
                    UC
                  </a>
                  <a href="/constructor" className="text-gray-600 hover:text-gray-900">
                    Конструктор
                  </a>
                </div>
                <div className="flex items-center space-x-4">
                  <a href="/orders" className="text-gray-600 hover:text-gray-900">
                    Мои заказы
                  </a>
                  <button className="btn-primary">
                    Войти
                  </button>
                </div>
              </nav>
            </div>
          </header>

          <main className="flex-1">
            {children}
          </main>

          <footer className="bg-white border-t mt-auto">
            <div className="container mx-auto px-4 py-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">UC</h3>
                  <p className="text-gray-600 text-sm">
                    Создай уникальный торт своей мечты с помощью нашего конструктора
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Навигация</h3>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/constructor" className="text-gray-600 hover:text-gray-900">Конструктор</a></li>
                    <li><a href="/orders" className="text-gray-600 hover:text-gray-900">Мои заказы</a></li>
                    <li><a href="/help" className="text-gray-600 hover:text-gray-900">Помощь</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Контакты</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>Email: support@uc-constructor.com</li>
                    <li>Телефон: +7 (999) 123-45-67</li>
                  </ul>
                </div>
              </div>
              <div className="border-t mt-8 pt-8 text-center text-sm text-gray-500">
                <p>&copy; 2024 UC. Все права защищены.</p>
              </div>
            </div>
          </footer>
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
