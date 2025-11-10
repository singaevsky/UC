export type ReviewType = 'product' | 'confectioner' | 'shop' | 'brand';
export type ReviewStatus = 'pending' | 'published' | 'rejected' | 'under_review';

export interface Review {
  id: number;
  product_id?: number;
  confectioner_id?: string;
  shop_id?: number;
  brand_review: boolean;
  user_id?: string;
  review_type: ReviewType;
  rating: number;
  text?: string;
  image_url?: string;
  photos: string[];
  status: ReviewStatus;
  created_at: string;
  updated_at?: string;

  // Административные поля
  admin_response?: string;
  admin_responded_at?: string;
  admin_responded_by?: string;
  is_featured: boolean;
  helpful_votes: number;
  reported_count: number;

  // Связанные данные
  order_id?: number;
  verified_purchase: boolean;

  // Расширенные связи
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
  products?: {
    name: string;
    images: string[];
  };
  confectioner_profiles?: {
    full_name: string;
    specialty?: string;
  };
  order_items?: {
    name_snapshot: string;
  };

  // Связанные ответы
  review_responses?: ReviewResponse[];
}

export interface ReviewResponse {
  id: number;
  review_id: number;
  responder_id: string;
  content: string;
  is_admin_response: boolean;
  created_at: string;
  updated_at: string;

  responder_profile?: {
    full_name: string;
    role: string;
  };
}

export interface ReviewReport {
  id: number;
  review_id: number;
  reporter_id?: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;

  review?: Review;
  reporter_profile?: {
    full_name: string;
  };
  reviewer_profile?: {
    full_name: string;
  };
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  reviews_by_type: {
    product: number;
    confectioner: number;
    shop: number;
    brand: number;
  };
  verified_reviews: number;
  featured_reviews: number;
  pending_moderation: number;
}

export interface CreateReviewData {
  review_type: ReviewType;
  rating: number;
  text?: string;
  product_id?: number;
  confectioner_id?: string;
  shop_id?: number;
  order_id?: number;
  photos?: FileList;
}

export interface UpdateReviewData {
  rating?: number;
  text?: string;
  photos?: string[];
}

export interface CreateResponseData {
  content: string;
  is_admin_response?: boolean;
}

export interface ReviewModerationData {
  status?: ReviewStatus;
  admin_response?: string;
  is_featured?: boolean;
  admin_notes?: string;
}
