export interface Product {
  id: string;
  product_name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  location?: string | null;
  created_at: Date;
  updated_at: Date;
}
