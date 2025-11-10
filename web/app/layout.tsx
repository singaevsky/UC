import './globals.scss';
import { createServerComponentClient, createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ReactNode } from 'react';
import Header from './layout-header';
import Footer from './layout-footer';
import SeoHead from '@/components/SeoHead';

export const metadata = {
  title: 'Уездный кондитер - свежие торты и десерты',
  description: 'Интернет-магазин кондитерской "Уездный кондитер". Свежие торты, десерты и индивидуальные заказы. Конструктор тортов онлайн.'
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="ru">
      <head>
        <SeoHead />

        {/* Yandex.Metrica */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

            ym(${process.env.YANDEX_METRIKA_ID || '00000000'}, "init", {
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true,
                webvisor:true
            });
          `
        }} />
      </head>
      <body>
        <Header userEmail={user?.email ?? null} />
        <main className="container">{children}</main>
        <Footer />

        {/* Noscript */}
        <noscript>
          <div><img src="https://mc.yandex.ru/watch/${process.env.YANDEX_METRIKA_ID || '00000000'}" style={{position:'absolute', left:'-9999px', alt:''}} /></div>
        </noscript>
      </body>
    </html>
  );
}
