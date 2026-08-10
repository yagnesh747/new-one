import { db } from '../config/db';
import { Customer, CustomerFollowUp } from '../models/customer.model';
import { AppError } from '../utils/appError';

export class CustomerService {
  static async getCustomers(params: {
    search?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let valCount = 1;

    if (params.search) {
      conditions.push(`(customer_name ILIKE $${valCount} OR email ILIKE $${valCount} OR mobile_number ILIKE $${valCount} OR business_name ILIKE $${valCount})`);
      values.push(`%${params.search.trim()}%`);
      valCount++;
    }

    if (params.status) {
      conditions.push(`status = $${valCount}`);
      values.push(params.status);
      valCount++;
    }

    if (params.type) {
      conditions.push(`customer_type = $${valCount}`);
      values.push(params.type);
      valCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
    const countRes = await db.query(countQuery, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const dataQuery = `
      SELECT * FROM customers
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${valCount} OFFSET $${valCount + 1}
    `;

    const dataRes = await db.query<Customer>(dataQuery, [...values, limit, offset]);

    return {
      customers: dataRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getCustomerById(id: string): Promise<Customer> {
    const query = 'SELECT * FROM customers WHERE id = $1';
    const result = await db.query<Customer>(query, [id]);

    if (result.rows.length === 0) {
      throw new AppError('Customer not found.', 404);
    }

    return result.rows[0];
  }

  static async createCustomer(data: any): Promise<Customer> {
    const id = (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    // Check duplicate email
    const existing = await db.query('SELECT id FROM customers WHERE email = $1', [data.email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      throw new AppError('Customer with this email address already exists.', 409);
    }

    const query = `
      INSERT INTO customers (id, customer_name, mobile_number, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      id,
      data.customer_name.trim(),
      data.mobile_number.trim(),
      data.email.toLowerCase().trim(),
      data.business_name.trim(),
      data.gst_number ? data.gst_number.trim() : null,
      data.customer_type,
      data.address.trim(),
      data.status || 'Active',
      data.follow_up_date || null,
      data.notes || null,
    ];

    const result = await db.query<Customer>(query, values);
    return result.rows[0];
  }

  static async updateCustomer(id: string, data: any): Promise<Customer> {
    await this.getCustomerById(id);

    if (data.email) {
      const existing = await db.query('SELECT id FROM customers WHERE email = $1 AND id != $2', [
        data.email.toLowerCase().trim(),
        id,
      ]);
      if (existing.rows.length > 0) {
        throw new AppError('Customer with this email address already exists.', 409);
      }
    }

    const updates: string[] = [];
    const values: any[] = [];
    let valCount = 1;

    const fields = ['customer_name', 'mobile_number', 'email', 'business_name', 'gst_number', 'customer_type', 'address', 'status', 'follow_up_date', 'notes'];

    for (const field of fields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${valCount}`);
        values.push(data[field]);
        valCount++;
      }
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE customers
      SET ${updates.join(', ')}
      WHERE id = $${valCount}
      RETURNING *
    `;

    const result = await db.query<Customer>(query, values);
    return result.rows[0];
  }

  static async deleteCustomer(id: string): Promise<void> {
    await this.getCustomerById(id);
    await db.query('DELETE FROM customers WHERE id = $1', [id]);
  }

  static async addFollowUp(customerId: string, note: string, followUpDate?: string, userId?: string): Promise<CustomerFollowUp> {
    await this.getCustomerById(customerId);

    const id = (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);

    const query = `
      INSERT INTO customer_followups (id, customer_id, note, follow_up_date, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [id, customerId, note.trim(), followUpDate || null, userId || null];
    const result = await db.query<CustomerFollowUp>(query, values);

    // Update customer follow_up_date if provided
    if (followUpDate) {
      await db.query('UPDATE customers SET follow_up_date = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        followUpDate,
        customerId,
      ]);
    }

    return result.rows[0];
  }

  static async getFollowUps(customerId: string): Promise<CustomerFollowUp[]> {
    await this.getCustomerById(customerId);

    const query = `
      SELECT f.*, u.full_name as created_by_name
      FROM customer_followups f
      LEFT JOIN users u ON f.created_by = u.id
      WHERE f.customer_id = $1
      ORDER BY f.created_at DESC
    `;

    const result = await db.query<CustomerFollowUp>(query, [customerId]);
    return result.rows;
  }
}
