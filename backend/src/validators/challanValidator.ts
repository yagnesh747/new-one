import { z } from 'zod';

const challanItemSchema = z.object({
  product_id: z.number().int().positive('Product ID is required'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
});

export const createChallanSchema = z.object({
  customer_id: z.number().int().positive('Customer is required'),
  status: z.enum(['Draft', 'Confirmed'], {
    message: 'Initial status must be Draft or Confirmed',
  }),
  items: z.array(challanItemSchema).min(1, 'Challan must contain at least one product item'),
});

export const updateChallanSchema = z.object({
  customer_id: z.number().int().positive('Customer is required'),
  items: z.array(challanItemSchema).min(1, 'Challan must contain at least one product item'),
});
