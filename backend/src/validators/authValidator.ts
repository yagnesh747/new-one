import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, { message: 'Full name is required' }),
  email: z.string().email({ message: 'Invalid email address format' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  role: z.enum(['Admin', 'Sales', 'Warehouse', 'Accounts'], {
    message: 'Role must be Admin, Sales, Warehouse, or Accounts',
  }),
});
