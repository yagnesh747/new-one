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
  created_at: Date;
}
