import { z } from 'zod';

export const createProductSchema = z.object({
  product_name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  category: z.string().min(2, 'Category is required'),
  unit_price: z.number().positive('Unit price must be greater than 0'),
  current_stock: z.number().int().min(0, 'Stock cannot be negative'),
  min_stock_alert: z.number().int().min(0, 'Minimum stock alert must be at least 0').default(5),
  location: z.string().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export const stockAdjustmentSchema = z.object({
  quantity_changed: z.number().int().positive('Quantity changed must be a positive integer'),
  movement_type: z.enum(['IN', 'OUT']),
  reason: z.string().min(3, 'Reason for stock movement is required'),
});
