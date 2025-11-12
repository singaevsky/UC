// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Database types
export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: number
          name: string
          description: string
          price: number
          image_url?: string
          category_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description: string
          price: number
          image_url?: string
          category_id: number
        }
        Update: {
          name?: string
          description?: string
          price?: number
          image_url?: string
          category_id?: number
        }
      }
      orders: {
        Row: {
          id: number
          user_id: string
          total_amount: number
          status: string
          delivery_address: string
          delivery_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          total_amount: number
          status?: string
          delivery_address: string
          delivery_date: string
        }
        Update: {
          total_amount?: number
          status?: string
          delivery_address?: string
          delivery_date?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name?: string
          role: string
          created_at: string
        }
      }
    }
  }
}

// Helper functions
export async function getProducts() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function getOrders(userId?: string) {
  const supabase = createClient()
  let query = supabase.from('orders').select('*')
  
  if (userId) {
    query = query.eq('user_id', userId)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function createOrder(orderData: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single()
  
  if (error) throw error
  return data
}