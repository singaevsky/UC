export type UserRole = 'user' | 'confectioner' | 'manager' | 'supervisor' | 'admin';

export interface Shift {
  id: number;
  user_id: string;
  start_time: string;
  end_time?: string;
  status: 'active' | 'break' | 'ended';
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  assigned_to?: string;
  order_id?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  created_by?: string;
  created_at: string;
  completed_at?: string;
}

export interface ProductionStage {
  id: number;
  order_item_id: number;
  stage_name: string;
  status: 'pending' | 'in_progress' | 'quality_check' | 'completed';
  started_at?: string;
  completed_at?: string;
  notes?: string;
  assigned_to?: string;
  created_at: string;
}

export interface Report {
  id: number;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  title: string;
  data: any;
  generated_by?: string;
  period_start?: string;
  period_end?: string;
  created_at: string;
}

export interface WarehouseOperation {
  id: number;
  operation_type: 'purchase' | 'usage' | 'adjustment' | 'waste';
  product_name: string;
  quantity: number;
  unit: string;
  cost_per_unit?: number;
  total_cost?: number;
  supplier?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface ClientCommunication {
  id: number;
  order_id?: number;
  client_id?: string;
  type: 'call' | 'email' | 'sms' | 'meeting' | 'note';
  direction: 'incoming' | 'outgoing';
  content?: string;
  manager_id?: string;
  created_at: string;
  follow_up_required: boolean;
  follow_up_date?: string;
}

export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  today_orders: number;
  total_revenue: number;
  today_revenue: number;
  active_tasks: number;
  completed_tasks: number;
  low_stock_items: number;
}

export interface OrderWithDetails {
  id: number;
  status: string;
  total: number;
  created_at: string;
  delivery_method: string;
  payment_method: string;
  comments?: string;
  client_name?: string;
  client_phone?: string;
  items: Array<{
    id: number;
    name_snapshot: string;
    quantity: number;
    price: number;
    cake_design?: any;
  }>;
  tasks?: Task[];
  production_stages?: ProductionStage[];
  communications?: ClientCommunication[];
}
