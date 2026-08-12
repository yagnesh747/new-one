import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  mobile: z.string().min(5, 'Valid mobile number is required'),
  email: z.string().email('Invalid email address format'),
  business_name: z.string().min(1, 'Business name is required'),
  gst_number: z.string().optional().nullable(),
  type: z.enum(['Retail', 'Wholesale', 'Distributor'], {
    message: 'Customer type must be Retail, Wholesale, or Distributor',
  }),
  address: z.string().min(1, 'Address is required'),
  status: z.enum(['Lead', 'Active', 'Inactive'], {
    message: 'Status must be Lead, Active, or Inactive',
  }),
  followup_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const followupSchema = z.object({
  note: z.string().min(1, 'Follow-up note content is required'),
});
