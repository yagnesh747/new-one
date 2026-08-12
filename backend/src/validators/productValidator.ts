import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU / Product Code is required'),
  category: z.string().min(1, 'Category is required'),
  unit_price: z.number().min(0, 'Unit price must be a non-negative number'),
  current_stock: z.number().int().min(0, 'Current stock cannot be negative'),
  min_stock_alert: z.number().int().min(0, 'Minimum stock alert quantity cannot be negative'),
  location: z.string().min(1, 'Warehouse location is required'),
});

export const stockMovementSchema = z.object({
  product_id: z.number().int().positive('Product ID is required'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  movement_type: z.enum(['IN', 'OUT'], {
    message: 'Movement type must be IN or OUT',
  }),
  reason: z.string().min(1, 'Reason for stock movement is required'),
});
