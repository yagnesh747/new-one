import { db } from '../config/db';
import { StockMovement } from '../models/stock.model';
import { ProductService } from './productService';
import { AppError } from '../utils/appError';

export class StockService {
  static async addStockMovement(data: {
    product_id: string;
    quantity_changed: number;
    movement_type: 'IN' | 'OUT';
    reason: string;
    user_id?: string;
  }): Promise<StockMovement> {
    return await db.transaction(async (client) => {
      // Fetch product with row locking
      const productRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [data.product_id]);
      if (productRes.rows.length === 0) {
        throw new AppError('Product not found.', 404);
      }

      const product = productRes.rows[0];
      const currentStock = parseInt(product.current_stock, 10);
      const qty = data.quantity_changed;

      let newStock = currentStock;

      if (data.movement_type === 'IN') {
        newStock += qty;
      } else {
        if (currentStock < qty) {
          throw new AppError(
            `Insufficient stock for SKU ${product.sku}. Available: ${currentStock}, Requested reduction: ${qty}. Stock cannot be negative.`,
            400
          );
        }
        newStock -= qty;
      }

      // Update product current stock
      await client.query('UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        newStock,
        data.product_id,
      ]);

      // Record movement
      const id = (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      const movementQuery = `
        INSERT INTO stock_movements (id, product_id, quantity_changed, movement_type, reason, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const movementRes = await client.query(movementQuery, [
        id,
        data.product_id,
        data.quantity_changed,
        data.movement_type,
        data.reason.trim(),
        data.user_id || null,
      ]);

      return movementRes.rows[0];
    });
  }

  static async getStockMovements(params: {
    product_id?: string;
    movement_type?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let valCount = 1;

    if (params.product_id) {
      conditions.push(`sm.product_id = $${valCount}`);
      values.push(params.product_id);
      valCount++;
    }

    if (params.movement_type) {
      conditions.push(`sm.movement_type = $${valCount}`);
      values.push(params.movement_type);
      valCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM stock_movements sm ${whereClause}`;
    const countRes = await db.query(countQuery, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const dataQuery = `
      SELECT sm.*, p.product_name, p.sku, u.full_name as created_by_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.created_by = u.id
      ${whereClause}
      ORDER BY sm.created_at DESC
      LIMIT $${valCount} OFFSET $${valCount + 1}
    `;

    const dataRes = await db.query<StockMovement>(dataQuery, [...values, limit, offset]);

    return {
      movements: dataRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
