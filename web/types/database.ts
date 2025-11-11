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
          author_id: string | null
          category_id: number | null
          tags: string[]
          featured: boolean
          views_count: number
          likes_count: number
          reading_time: number | null
          meta_title: string | null
          meta_description: string | null
          cover_alt: string | null
          updated_by: string | null
          updated_at: string | null
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
          author_id?: string | null
          category_id?: number | null
          tags?: string[]
          featured?: boolean
          views_count?: number
          likes_count?: number
          reading_time?: number | null
          meta_title?: string | null
          meta_description?: string | null
          cover_alt?: string | null
          updated_by?: string | null
          updated_at?: string | null
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
          author_id?: string | null
          category_id?: number | null
          tags?: string[]
          featured?: boolean
          views_count?: number
          likes_count?: number
          reading_time?: number | null
          meta_title?: string | null
          meta_description?: string | null
          cover_alt?: string | null
          updated_by?: string | null
          updated_at?: string | null
        }
      }
      blog_categories: {
        Row: {
          id: number
          name: string
          slug: string
          description: string | null
          color: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description?: string | null
          color?: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string | null
          color?: string
          created_at?: string
        }
      }
      post_comments: {
        Row: {
          id: number
          post_id: number
          user_id: string | null
          parent_id: number | null
          content: string
          status: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          post_id: number
          user_id?: string | null
          parent_id?: number | null
          content: string
          status?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          post_id?: number
          user_id?: string | null
          parent_id?: number | null
          content?: string
          status?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      faq_items: {
        Row: {
          id: number
          category: string
          question: string
          answer: string
          order_index: number
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          category: string
          question: string
          answer: string
          order_index?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          category?: string
          question?: string
          answer?: string
          order_index?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      blog_media: {
        Row: {
          id: number
          post_id: number
          file_url: string
          file_name: string
          file_type: string
          file_size: number | null
          alt_text: string | null
          created_at: string
        }
        Insert: {
          id?: number
          post_id: number
          file_url: string
          file_name: string
          file_type: string
          file_size?: number | null
          alt_text?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          post_id?: number
          file_url?: string
          file_name?: string
          file_type?: string
          file_size?: number | null
          alt_text?: string | null
          created_at?: string
        }
      }
