// lib/types.ts
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category_id: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export interface Order {
  id: number;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  delivery_address: string;
  delivery_date: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  customization_data?: any;
}


export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'customer' | 'admin' | 'manager' | 'confectioner' | 'supervisor';
  created_at: string;
}

export interface Review {
  id: number;
  user_id: string;
  product_id?: number;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CakeCustomization {
  form: string;
  size: string;
  flavors: string[];
  toppings: string[];
  colors: string[];
  text?: string;
  special_requests?: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}
>>>>>>> 78f6f56489c2b1629243de13e1151d7d7000e0ba
