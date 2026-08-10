import { z } from 'zod';

export const createCustomerSchema = z.object({
  customer_name: z.string().min(2, 'Customer name is required'),
  mobile_number: z.string().min(8, 'Mobile number must be at least 8 digits'),
  email: z.string().email('Invalid email address format'),
  business_name: z.string().min(2, 'Business name is required'),
  gst_number: z.string().optional().nullable(),
  customer_type: z.enum(['Retail', 'Wholesale', 'Distributor']),
  address: z.string().min(3, 'Address is required'),
  status: z.enum(['Lead', 'Active', 'Inactive']).default('Active'),
  follow_up_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const addFollowUpSchema = z.object({
  note: z.string().min(2, 'Follow-up note is required'),
  follow_up_date: z.string().optional().nullable(),
});
