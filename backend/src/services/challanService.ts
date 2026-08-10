import { db } from '../config/db';
import { Challan, ChallanItem } from '../models/challan.model';
import { CustomerService } from './customerService';
import { AppError } from '../utils/appError';

export class ChallanService {
  private static async generateChallanNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const countRes = await db.query('SELECT COUNT(*) as count FROM challans');
    const nextSeq = parseInt(countRes.rows[0].count, 10) + 1;
    return `CH-${year}-${nextSeq.toString().padStart(4, '0')}`;
  }

  static async createChallan(data: {
    customer_id: string;
    notes?: string;
    items: { product_id: string; quantity: number }[];
    confirm_immediately?: boolean;
    user_id?: string;
  }): Promise<Challan> {
    // Check customer exists
    await CustomerService.getCustomerById(data.customer_id);

    return await db.transaction(async (client) => {
      const challanId = (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      const challanNumber = await this.generateChallanNumber();

      let totalQuantity = 0;
      let totalAmount = 0;
      const snapshotItems: {
        id: string;
        product_id: string;
        product_name: string;
        sku: string;
        unit_price: number;
        quantity: number;
        line_total: number;
      }[] = [];

      for (const item of data.items) {
        const prodRes = await client.query('SELECT * FROM products WHERE id = $1', [item.product_id]);
        if (prodRes.rows.length === 0) {
          throw new AppError(`Product with ID ${item.product_id} not found.`, 404);
        }

        const product = prodRes.rows[0];
        const unitPrice = parseFloat(product.unit_price);
        const lineTotal = unitPrice * item.quantity;
        totalQuantity += item.quantity;
        totalAmount += lineTotal;

        const itemId = (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);

        snapshotItems.push({
          id: itemId,
          product_id: product.id,
          product_name: product.product_name,
          sku: product.sku,
          unit_price: unitPrice,
          quantity: item.quantity,
          line_total: lineTotal,
        });
      }

      const initialStatus = data.confirm_immediately ? 'Confirmed' : 'Draft';
      const confirmedAt = data.confirm_immediately ? new Date() : null;

      // Insert Challan Header
      const challanQuery = `
        INSERT INTO challans (id, challan_number, customer_id, total_quantity, total_amount, status, notes, created_by, confirmed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const challanRes = await client.query(challanQuery, [
        challanId,
        challanNumber,
        data.customer_id,
        totalQuantity,
        totalAmount,
        initialStatus,
        data.notes || null,
        data.user_id || null,
        confirmedAt,
      ]);

      // Insert Challan Items with snapshot data
      for (const snapshot of snapshotItems) {
        await client.query(
          `INSERT INTO challan_items (id, challan_id, product_id, product_name, sku, unit_price, quantity, line_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            snapshot.id,
            challanId,
            snapshot.product_id,
            snapshot.product_name,
            snapshot.sku,
            snapshot.unit_price,
            snapshot.quantity,
            snapshot.line_total,
          ]
        );
      }

      // If confirming immediately, check stock and deduct stock within same transaction
      if (data.confirm_immediately) {
        for (const item of snapshotItems) {
          const lockedProdRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
          const prod = lockedProdRes.rows[0];
          const availableStock = parseInt(prod.current_stock, 10);

          if (item.quantity > availableStock) {
            throw new AppError(
              `Insufficient stock for SKU ${item.sku}. Available: ${availableStock}, Requested: ${item.quantity}.`,
              400
            );
          }

          const newStock = availableStock - item.quantity;
          await client.query('UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
            newStock,
            item.product_id,
          ]);

          const movementId = (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
          await client.query(
            `INSERT INTO stock_movements (id, product_id, quantity_changed, movement_type, reason, created_by)
             VALUES ($1, $2, $3, 'OUT', $4, $5)`,
            [movementId, item.product_id, item.quantity, `Sales Challan Confirmation #${challanNumber}`, data.user_id || null]
          );
        }
      }

      const createdChallan = challanRes.rows[0];
      createdChallan.items = snapshotItems;
      return createdChallan;
    });
  }

  static async getChallans(params: {
    search?: string;
    status?: string;
    customer_id?: string;
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
      conditions.push(`(ch.challan_number ILIKE $${valCount} OR c.customer_name ILIKE $${valCount} OR c.business_name ILIKE $${valCount})`);
      values.push(`%${params.search.trim()}%`);
      valCount++;
    }

    if (params.status) {
      conditions.push(`ch.status = $${valCount}`);
      values.push(params.status);
      valCount++;
    }

    if (params.customer_id) {
      conditions.push(`ch.customer_id = $${valCount}`);
      values.push(params.customer_id);
      valCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM challans ch
      JOIN customers c ON ch.customer_id = c.id
      ${whereClause}
    `;
    const countRes = await db.query(countQuery, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const dataQuery = `
      SELECT ch.*, c.customer_name, c.business_name, u.full_name as created_by_name
      FROM challans ch
      JOIN customers c ON ch.customer_id = c.id
      LEFT JOIN users u ON ch.created_by = u.id
      ${whereClause}
      ORDER BY ch.created_at DESC
      LIMIT $${valCount} OFFSET $${valCount + 1}
    `;

    const dataRes = await db.query<Challan>(dataQuery, [...values, limit, offset]);

    return {
      challans: dataRes.rows.map((ch) => ({
        ...ch,
        total_amount: parseFloat(ch.total_amount as any),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getChallanById(id: string): Promise<Challan> {
    const challanQuery = `
      SELECT ch.*, c.customer_name, c.business_name, c.mobile_number, c.email, c.address, c.gst_number, u.full_name as created_by_name
      FROM challans ch
      JOIN customers c ON ch.customer_id = c.id
      LEFT JOIN users u ON ch.created_by = u.id
      WHERE ch.id = $1
    `;
    const challanRes = await db.query<Challan>(challanQuery, [id]);

    if (challanRes.rows.length === 0) {
      throw new AppError('Sales Challan not found.', 404);
    }

    const challan = challanRes.rows[0];
    challan.total_amount = parseFloat(challan.total_amount as any);

    const itemsQuery = 'SELECT * FROM challan_items WHERE challan_id = $1 ORDER BY created_at ASC';
    const itemsRes = await db.query<ChallanItem>(itemsQuery, [id]);

    challan.items = itemsRes.rows.map((item) => ({
      ...item,
      unit_price: parseFloat(item.unit_price as any),
      line_total: parseFloat(item.line_total as any),
    }));

    return challan;
  }

  static async confirmChallan(id: string, userId?: string): Promise<Challan> {
    return await db.transaction(async (client) => {
      // Lock challan row
      const challanRes = await client.query('SELECT * FROM challans WHERE id = $1 FOR UPDATE', [id]);
      if (challanRes.rows.length === 0) {
        throw new AppError('Sales Challan not found.', 404);
      }

      const challan = challanRes.rows[0];

      if (challan.status === 'Confirmed') {
        throw new AppError(`Challan #${challan.challan_number} is already confirmed. Stock deduction already completed.`, 400);
      }

      if (challan.status === 'Cancelled') {
        throw new AppError(`Cannot confirm cancelled Challan #${challan.challan_number}.`, 400);
      }

      // Fetch items
      const itemsRes = await client.query('SELECT * FROM challan_items WHERE challan_id = $1', [id]);
      const items = itemsRes.rows;

      // Lock and validate product stock for every item
      for (const item of items) {
        const prodRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
        if (prodRes.rows.length === 0) {
          throw new AppError(`Product with SKU '${item.sku}' not found in inventory.`, 404);
        }

        const product = prodRes.rows[0];
        const availableStock = parseInt(product.current_stock, 10);

        if (item.quantity > availableStock) {
          throw new AppError(
            `Insufficient stock for SKU ${item.sku}. Available: ${availableStock}, Requested: ${item.quantity}.`,
            400
          );
        }
      }

      // Reduce stock and create OUT stock movement
      for (const item of items) {
        const prodRes = await client.query('SELECT current_stock FROM products WHERE id = $1', [item.product_id]);
        const availableStock = parseInt(prodRes.rows[0].current_stock, 10);
        const newStock = availableStock - item.quantity;

        await client.query('UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
          newStock,
          item.product_id,
        ]);

        const movementId = (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
        await client.query(
          `INSERT INTO stock_movements (id, product_id, quantity_changed, movement_type, reason, created_by)
           VALUES ($1, $2, $3, 'OUT', $4, $5)`,
          [movementId, item.product_id, item.quantity, `Sales Challan Confirmation #${challan.challan_number}`, userId || null]
        );
      }

      // Update challan status to Confirmed
      await client.query(
        `UPDATE challans
         SET status = 'Confirmed', confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );

      const updatedChallanRes = await client.query('SELECT * FROM challans WHERE id = $1', [id]);
      const updatedChallan = updatedChallanRes.rows[0];
      updatedChallan.items = items;
      return updatedChallan;
    });
  }

  static async cancelChallan(id: string): Promise<Challan> {
    const challanRes = await db.query('SELECT * FROM challans WHERE id = $1', [id]);
    if (challanRes.rows.length === 0) {
      throw new AppError('Sales Challan not found.', 404);
    }

    const challan = challanRes.rows[0];
    if (challan.status === 'Confirmed') {
      throw new AppError(`Cannot cancel confirmed Challan #${challan.challan_number}. Stock was already dispatched.`, 400);
    }

    const updateRes = await db.query(
      `UPDATE challans SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    return updateRes.rows[0];
  }
}
