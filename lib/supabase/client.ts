import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

// Создание клиента для Client Components
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// кспорт типов
export type { Database }
