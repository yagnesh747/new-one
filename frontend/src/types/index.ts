export type UserRole = 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export type CustomerType = 'Retail' | 'Wholesale' | 'Distributor';
export type CustomerStatus = 'Lead' | 'Active' | 'Inactive';

export interface Customer {
  id: string;
  customer_name: string;
  mobile_number: string;
  email: string;
  business_name: string;
  gst_number?: string | null;
  customer_type: CustomerType;
  address: string;
  status: CustomerStatus;
  follow_up_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerFollowUp {
  id: string;
  customer_id: string;
  note: string;
  follow_up_date?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  product_name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  location?: string | null;
  created_at: string;
  updated_at: string;
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  quantity_changed: number;
  movement_type: MovementType;
  reason: string;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
}

export type ChallanStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export interface ChallanItem {
  id: string;
  challan_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Challan {
  id: string;
  challan_number: string;
  customer_id: string;
  customer_name?: string;
  business_name?: string;
  mobile_number?: string;
  email?: string;
  address?: string;
  gst_number?: string;
  total_quantity: number;
  total_amount: number;
  status: ChallanStatus;
  notes?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
  items?: ChallanItem[];
}

export interface DashboardStats {
  customers: {
    total: number;
    active: number;
  };
  products: {
    total: number;
    lowStockCount: number;
  };
  challans: {
    total: number;
    confirmed: number;
  };
  recentMovements: StockMovement[];
  recentChallans: Challan[];
  lowStockItems: Product[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  status: 'success' | 'fail' | 'error';
  message?: string;
  data: T;
  pagination?: Pagination;
  errors?: any[];
}
