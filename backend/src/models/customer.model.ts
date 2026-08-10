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
  follow_up_date?: string | Date | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerFollowUp {
  id: string;
  customer_id: string;
  note: string;
  follow_up_date?: string | Date | null;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: Date;
}
