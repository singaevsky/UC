// file: lib/logrocket.ts
import LogRocket from 'logrocket';

if (process.env.NEXT_PUBLIC_LOGROCKET_APP_ID) {
  LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_APP_ID);
  // Пример идентификации после логина
  // Идентификацию лучше делать в том месте, где у вас есть объект user из Supabase
  // LogRocket.identify(user.id, { name: user.email });
}
