export type UserRole = 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export type CustomerType = 'Retail' | 'Wholesale' | 'Distributor';
export type CustomerStatus = 'Lead' | 'Active' | 'Inactive';

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_number?: string | null;
  type: CustomerType;
  address: string;
  status: CustomerStatus;
  followup_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerFollowup {
  id: number;
  customer_id: number;
  note: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  location: string;
  created_at: string;
  updated_at: string;
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: number;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  movement_type: MovementType;
  reason: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
}

export type ChallanStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export interface ChallanItem {
  id?: number;
  challan_id?: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  unit_price: number;
  quantity: number;
}

export interface Challan {
  id: number;
  challan_number: string;
  customer_id: number;
  customer_name?: string;
  customer_business?: string;
  total_quantity: number;
  total_amount: number;
  status: ChallanStatus;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  items?: ChallanItem[];
}

export interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  totalChallans: number;
  recentMovements: StockMovement[];
  recentChallans: Challan[];
}

export interface DashboardSummary {
  totalCustomers: number;
  totalProducts: number;
  totalChallans: number;
  totalRevenue: number;
  pendingPayments: number;
  lowStockCount: number;
}

export interface DashboardLowStockProduct {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  min_stock_alert: number;
  location: string;
}

export interface DashboardActivityItem {
  id: number;
  challan_number: string;
  customer_name: string;
  customer_business: string;
  total_amount: number;
  total_quantity: number;
  status: Challan['status'];
  created_at: string;
}

export interface DashboardSalesPoint {
  month: string;
  label: string;
  revenue: number;
  order_count: number;
}

export interface DashboardTopCustomer {
  id: number;
  name: string;
  business_name: string;
  total_sales: number;
  orders: number;
}

export interface DashboardCustomerSummary {
  recentCustomers: {
    id: number;
    name: string;
    business_name: string;
    created_at: string;
  }[];
  topCustomers: DashboardTopCustomer[];
}

export interface ApiError {
  message: string;
  errors?: string[];
}
