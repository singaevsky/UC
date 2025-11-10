      reviews: {
        Row: {
          id: number
          product_id: number | null
          confectioner_id: string | null
          shop_id: number | null
          brand_review: boolean
          user_id: string | null
          review_type: string
          rating: number
          text: string | null
          image_url: string | null
          photos: string[]
          status: string
          created_at: string
          updated_at: string
          admin_response: string | null
          admin_responded_at: string | null
          admin_responded_by: string | null
          is_featured: boolean
          helpful_votes: number
          reported_count: number
          order_id: number | null
          verified_purchase: boolean
        }
        Insert: {
          id?: number
          product_id?: number | null
          confectioner_id?: string | null
          shop_id?: number | null
          brand_review?: boolean
          user_id?: string | null
          review_type?: string
          rating: number
          text?: string | null
          image_url?: string | null
          photos?: string[]
          status?: string
          created_at?: string
          updated_at?: string
          admin_response?: string | null
          admin_responded_at?: string | null
          admin_responded_by?: string | null
          is_featured?: boolean
          helpful_votes?: number
          reported_count?: number
          order_id?: number | null
          verified_purchase?: boolean
        }
        Update: {
          id?: number
          product_id?: number | null
          confectioner_id?: string | null
          shop_id?: number | null
          brand_review?: boolean
          user_id?: string | null
          review_type?: string
          rating?: number
          text?: string | null
          image_url?: string | null
          photos?: string[]
          status?: string
          created_at?: string
          updated_at?: string
          admin_response?: string | null
          admin_responded_at?: string | null
          admin_responded_by?: string | null
          is_featured?: boolean
          helpful_votes?: number
          reported_count?: number
          order_id?: number | null
          verified_purchase?: boolean
        }
      }
      review_reports: {
        Row: {
          id: number
          review_id: number
          reporter_id: string | null
          reason: string
          description: string | null
          status: string
          admin_notes: string | null
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: number
          review_id: number
          reporter_id?: string | null
          reason: string
          description?: string | null
          status?: string
          admin_notes?: string | null
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          id?: number
          review_id?: number
          reporter_id?: string | null
          reason?: string
          description?: string | null
          status?: string
          admin_notes?: string | null
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
      }
      review_responses: {
        Row: {
          id: number
          review_id: number
          responder_id: string
          content: string
          is_admin_response: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          review_id: number
          responder_id: string
          content: string
          is_admin_response?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          review_id?: number
          responder_id?: string
          content?: string
          is_admin_response?: boolean
          created_at?: string
          updated_at?: string
        }
      }
