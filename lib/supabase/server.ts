import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

// Создание клиента для Server Components и API Routes
export function createClient() {
  return createServerComponentClient<Database>({ cookies })
}

// лиас для совместимости
export const createServerClient = createClient

// кспорт типов для удобства
export type { Database }
