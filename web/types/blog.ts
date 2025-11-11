export type PostStatus = 'draft' | 'published';
export type CommentStatus = 'pending' | 'published' | 'rejected';

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  created_at: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  cover_url?: string;
  cover_alt?: string;
  status: PostStatus;
  published_at?: string;
  created_at: string;
  updated_at?: string;

  // Расширенные поля
  author_id?: string;
  category_id?: number;
  tags: string[];
  featured: boolean;
  views_count: number;
  likes_count: number;
  reading_time?: number;
  meta_title?: string;
  meta_description?: string;
  updated_by?: string;

  // Связанные данные
  author?: {
    full_name: string;
    avatar_url?: string;
  };
  category?: BlogCategory;
  blog_media?: BlogMedia[];
  post_comments?: PostComment[];
}

export interface BlogMedia {
  id: number;
  post_id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  alt_text?: string;
  created_at: string;
}

export interface PostComment {
  id: number;
  post_id: number;
  user_id?: string;
  parent_id?: number;
  content: string;
  status: CommentStatus;
  created_at: string;
  updated_at?: string;

  // Связанные данные
  user?: {
    full_name: string;
    avatar_url?: string;
  };
  replies?: PostComment[];
}

export interface FaqItem {
  id: number;
  category: string;
  question: string;
  answer: string;
  order_index: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at?: string;

  // Связанные данные
  creator?: {
    full_name: string;
  };
}

export interface CreatePostData {
  title: string;
  excerpt?: string;
  content: string;
  cover_url?: string;
  cover_alt?: string;
  category_id?: number;
  tags?: string[];
  featured?: boolean;
  status?: PostStatus;
}

export interface UpdatePostData extends Partial<CreatePostData> {
  id: number;
}

export interface CreateCommentData {
  post_id: number;
  content: string;
  parent_id?: number;
}

export interface CreateFaqData {
  category: string;
  question: string;
  answer: string;
  order_index?: number;
  is_active?: boolean;
}

export interface BlogStats {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  featured_posts: number;
  total_views: number;
  total_likes: number;
  posts_by_category: Record<string, number>;
  recent_posts: BlogPost[];
  popular_posts: BlogPost[];
}

export interface FaqCategory {
  category: string;
  items: FaqItem[];
  count: number;
}

export interface SearchResult {
  posts: BlogPost[];
  total: number;
  query: string;
  category?: string;
  tags?: string[];
}
