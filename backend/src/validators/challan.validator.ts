import { z } from 'zod';

export const challanItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID format').or(z.string().min(1, 'Product ID is required')),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

export const createChallanSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  notes: z.string().optional().nullable(),
  items: z.array(challanItemSchema).min(1, 'At least one product item is required'),
  confirm_immediately: z.boolean().optional().default(false),
});

export const updateChallanSchema = z.object({
  customer_id: z.string().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(challanItemSchema).min(1, 'At least one product item is required').optional(),
});
