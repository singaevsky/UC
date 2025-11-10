export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          bonus_balance: number
          role: string
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          bonus_balance?: number
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          bonus_balance?: number
          role?: string
          created_at?: string
        }
      }
      products: {
        Row: {
          id: number
          name: string
          slug: string
          category_id: number
          description: string | null
          price: number
          base_weight: number | null
          event_types: string[]
          filling_ids: number[]
          images: string[]
          active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          category_id: number
          description?: string | null
          price: number
          base_weight?: number | null
          event_types?: string[]
          filling_ids?: number[]
          images?: string[]
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          category_id?: number
          description?: string | null
          price?: number
          base_weight?: number | null
          event_types?: string[]
          filling_ids?: number[]
          images?: string[]
          active?: boolean
          created_at?: string
        }
      }
      // ... другие таблицы по аналогии
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_bonus: {
        Args: {
          p_user_id: string
          p_amount: number
        }
        Returns: void
      }
    }
    Enums: {
      event_type: 'wedding' | 'birthday' | 'corporate' | 'anniversary' | 'kids' | 'other'
      order_status: 'created' | 'paid' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'refunded'
      delivery_method: 'pickup' | 'courier' | 'sdek'
      payment_method: 'card' | 'sberbank' | 'tinkoff' | 'yookassa'
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
    }
  }
}
