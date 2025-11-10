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
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          created_at?: string
        }
      }
      fillings: {
        Row: {
          id: number
          name: string
          slug: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string | null
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
      promotions: {
        Row: {
          id: number
          name: string
          description: string | null
          discount_percent: number | null
          discount_amount: number | null
          active: boolean
          starts_at: string | null
          ends_at: string | null
          promo_code: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          discount_percent?: number | null
          discount_amount?: number | null
          active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          promo_code?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          discount_percent?: number | null
          discount_amount?: number | null
          active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          promo_code?: string | null
          created_at?: string
        }
      }
      promotion_products: {
        Row: {
          promotion_id: number
          product_id: number
        }
        Insert: {
          promotion_id: number
          product_id: number
        }
        Update: {
          promotion_id?: number
          product_id?: number
        }
      }
      cart_items: {
        Row: {
          id: number
          user_id: string | null
          session_id: string | null
          product_id: number
          quantity: number
          options: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          session_id?: string | null
          product_id: number
          quantity: number
          options?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          session_id?: string | null
          product_id?: number
          quantity?: number
          options?: Json
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: number
          user_id: string | null
          status: string
          total: number
          bonus_used: number
          bonus_earned: number
          promo_code: string | null
          delivery_method: string
          delivery_price: number
          address: Json | null
          payment_method: string
          payment_status: string
          payment_id: string | null
          external_delivery_id: string | null
          comments: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          status?: string
          total: number
          bonus_used?: number
          bonus_earned?: number
          promo_code?: string | null
          delivery_method: string
          delivery_price?: number
          address?: Json | null
          payment_method: string
          payment_status?: string
          payment_id?: string | null
          external_delivery_id?: string | null
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          status?: string
          total?: number
          bonus_used?: number
          bonus_earned?: number
          promo_code?: string | null
          delivery_method?: string
          delivery_price?: number
          address?: Json | null
          payment_method?: string
          payment_status?: string
          payment_id?: string | null
          external_delivery_id?: string | null
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: number
          order_id: number
          product_id: number | null
          cake_design: Json | null
          name_snapshot: string
          price: number
          quantity: number
        }
        Insert: {
          id?: number
          order_id: number
          product_id?: number | null
          cake_design?: Json | null
          name_snapshot: string
          price: number
          quantity: number
        }
        Update: {
          id?: number
          order_id?: number
          product_id?: number | null
          cake_design?: Json | null
          name_snapshot?: string
          price?: number
          quantity?: number
        }
      }
      reviews: {
        Row: {
          id: number
          product_id: number
          user_id: string | null
          rating: number
          text: string | null
          image_url: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          product_id: number
          user_id?: string | null
          rating: number
          text?: string | null
          image_url?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: number
          product_id?: number
          user_id?: string | null
          rating?: number
          text?: string | null
          image_url?: string | null
          status?: string
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: number
          title: string
          slug: string
          excerpt: string | null
          content: string | null
          cover_url: string | null
          status: string
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          title: string
          slug: string
          excerpt?: string | null
          content?: string | null
          cover_url?: string | null
          status?: string
          published_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string | null
          cover_url?: string | null
          status?: string
          published_at?: string | null
          created_at?: string
        }
      }
      pages: {
        Row: {
          id: number
          slug: string
          title: string
          content: string | null
          published: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          slug: string
          title: string
          content?: string | null
          published?: boolean
          updated_at?: string
        }
        Update: {
          id?: number
          slug?: string
          title?: string
          content?: string | null
          published?: boolean
          updated_at?: string
        }
      }
      gallery: {
        Row: {
          id: number
          image_url: string
          title: string | null
          product_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          image_url: string
          title?: string | null
          product_id?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          image_url?: string
          title?: string | null
          product_id?: number | null
          created_at?: string
        }
      }
      banners: {
        Row: {
          id: number
          title: string
          image_url: string
          link: string | null
          active: boolean
          sort_order: number
          starts_at: string | null
          ends_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          title: string
          image_url: string
          link?: string | null
          active?: boolean
          sort_order?: number
          starts_at?: string | null
          ends_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          title?: string
          image_url?: string
          link?: string | null
          active?: boolean
          sort_order?: number
          starts_at?: string | null
          ends_at?: string | null
          created_at?: string
        }
      }
      events: {
        Row: {
          id: number
          user_id: string | null
          type: string
          payload: Json
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          type: string
          payload: Json
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          type?: string
          payload?: Json
          created_at?: string
        }
      }
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
