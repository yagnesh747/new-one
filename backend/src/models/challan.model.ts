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
  created_at?: Date;
}

export interface Challan {
  id: string;
  challan_number: string;
  customer_id: string;
  customer_name?: string;
  business_name?: string;
  total_quantity: number;
  total_amount: number;
  status: ChallanStatus;
  notes?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  confirmed_at?: Date | null;
  created_at: Date;
  updated_at: Date;
  items?: ChallanItem[];
}
