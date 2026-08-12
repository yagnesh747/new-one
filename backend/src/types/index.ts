export type UserRole = 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface CustomerFollowup {
  id: number;
  customer_id: number;
  note: string;
  created_by: number;
  created_by_name?: string;
  created_at: Date;
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
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
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
  created_at: Date;
  updated_at: Date;
  items?: ChallanItem[];
}

export interface AuthUserPayload {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}
