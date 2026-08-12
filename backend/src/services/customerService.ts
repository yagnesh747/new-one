import { query } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { Customer, CustomerFollowup } from '../types';
import * as mem from './memoryStore';

export const getCustomers = async (search?: string, status?: string, type?: string) => {
  try {
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params: any[] = [];
    if (search) { params.push(`%${search}%`); sql += ` AND (name ILIKE $${params.length} OR business_name ILIKE $${params.length} OR mobile ILIKE $${params.length} OR email ILIKE $${params.length})`; }
    if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
    if (type) { params.push(type); sql += ` AND type = $${params.length}`; }
    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    return result.rows;
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    let data = [...mem.customers];
    if (search) { const s = search.toLowerCase(); data = data.filter(c => c.name.toLowerCase().includes(s) || c.business_name.toLowerCase().includes(s) || c.mobile.includes(s) || c.email.toLowerCase().includes(s)); }
    if (status) data = data.filter(c => c.status === status);
    if (type) data = data.filter(c => c.type === type);
    return data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
};

export const getCustomerById = async (id: number): Promise<Customer> => {
  try {
    const result = await query('SELECT * FROM customers WHERE id = $1', [id]);
    if (result.rows.length === 0) throw new AppError('Customer not found.', 404);
    return result.rows[0];
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    const c = mem.customers.find(c => c.id === id);
    if (!c) throw new AppError('Customer not found.', 404);
    return c;
  }
};

export const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
  try {
    const { name, mobile, email, business_name, gst_number, type, address, status, followup_date, notes } = data;
    const result = await query(
      `INSERT INTO customers (name, mobile, email, business_name, gst_number, type, address, status, followup_date, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, mobile, email, business_name, gst_number || null, type, address, status || 'Lead', followup_date || null, notes || null]
    );
    return result.rows[0];
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    const now = new Date();
    const c: Customer = {
      id: mem.nextId.customer(), name: data.name!, mobile: data.mobile!, email: data.email!, business_name: data.business_name!,
      gst_number: data.gst_number || null, type: data.type!, address: data.address!, status: data.status || 'Lead',
      followup_date: data.followup_date || null, notes: data.notes || null, created_at: now, updated_at: now,
    };
    mem.customers.push(c);
    return c;
  }
};

export const updateCustomer = async (id: number, data: Partial<Customer>): Promise<Customer> => {
  try {
    await getCustomerById(id);
    const { name, mobile, email, business_name, gst_number, type, address, status, followup_date, notes } = data;
    const result = await query(
      `UPDATE customers SET name=$1,mobile=$2,email=$3,business_name=$4,gst_number=$5,type=$6,address=$7,status=$8,followup_date=$9,notes=$10,updated_at=CURRENT_TIMESTAMP WHERE id=$11 RETURNING *`,
      [name, mobile, email, business_name, gst_number || null, type, address, status, followup_date || null, notes || null, id]
    );
    return result.rows[0];
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    const idx = mem.customers.findIndex(c => c.id === id);
    if (idx === -1) throw new AppError('Customer not found.', 404);
    const updated = { ...mem.customers[idx], ...data, updated_at: new Date() };
    mem.customers[idx] = updated;
    return updated;
  }
};

export const deleteCustomer = async (id: number): Promise<void> => {
  try {
    await getCustomerById(id);
    await query('DELETE FROM customers WHERE id = $1', [id]);
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    const idx = mem.customers.findIndex(c => c.id === id);
    if (idx === -1) throw new AppError('Customer not found.', 404);
    mem.customers.splice(idx, 1);
  }
};

export const getCustomerFollowups = async (customerId: number): Promise<CustomerFollowup[]> => {
  try {
    await getCustomerById(customerId);
    const result = await query(
      `SELECT f.*, u.name as created_by_name FROM customer_followups f JOIN users u ON f.created_by = u.id WHERE f.customer_id = $1 ORDER BY f.created_at DESC`,
      [customerId]
    );
    return result.rows;
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    return mem.customerFollowups.filter(f => f.customer_id === customerId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
};

export const addCustomerFollowup = async (customerId: number, note: string, userId: number): Promise<CustomerFollowup> => {
  try {
    await getCustomerById(customerId);
    const result = await query(`INSERT INTO customer_followups (customer_id, note, created_by) VALUES ($1, $2, $3) RETURNING *`, [customerId, note, userId]);
    await query(`UPDATE customers SET notes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [note, customerId]);
    return result.rows[0];
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    const user = mem.users.find(u => u.id === userId);
    const f: CustomerFollowup = { id: mem.nextId.followup(), customer_id: customerId, note, created_by: userId, created_by_name: user?.name || 'User', created_at: new Date() };
    mem.customerFollowups.push(f);
    const cIdx = mem.customers.findIndex(c => c.id === customerId);
    if (cIdx !== -1) { mem.customers[cIdx].notes = note; mem.customers[cIdx].updated_at = new Date(); }
    return f;
  }
};
