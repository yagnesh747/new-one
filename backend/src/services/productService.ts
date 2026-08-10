import { db } from '../config/db';
import { Product } from '../models/product.model';
import { AppError } from '../utils/appError';

export class ProductService {
  static async getProducts(params: {
    search?: string;
    category?: string;
    lowStock?: boolean;
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
      conditions.push(`(product_name ILIKE $${valCount} OR sku ILIKE $${valCount} OR category ILIKE $${valCount})`);
      values.push(`%${params.search.trim()}%`);
      valCount++;
    }

    if (params.category) {
      conditions.push(`category = $${valCount}`);
      values.push(params.category);
      valCount++;
    }

    if (params.lowStock) {
      conditions.push(`current_stock <= min_stock_alert`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const countRes = await db.query(countQuery, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const dataQuery = `
      SELECT * FROM products
      ${whereClause}
      ORDER BY product_name ASC
      LIMIT $${valCount} OFFSET $${valCount + 1}
    `;

    const dataRes = await db.query<Product>(dataQuery, [...values, limit, offset]);

    return {
      products: dataRes.rows.map((p) => ({
        ...p,
        unit_price: parseFloat(p.unit_price as any),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getProductById(id: string): Promise<Product> {
    const query = 'SELECT * FROM products WHERE id = $1';
    const result = await db.query<Product>(query, [id]);

    if (result.rows.length === 0) {
      throw new AppError('Product not found.', 404);
    }

    const product = result.rows[0];
    product.unit_price = parseFloat(product.unit_price as any);
    return product;
  }

  static async createProduct(data: any): Promise<Product> {
    const id = (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const skuFormatted = data.sku.trim().toUpperCase();

    // Check duplicate SKU
    const existing = await db.query('SELECT id FROM products WHERE sku = $1', [skuFormatted]);
    if (existing.rows.length > 0) {
      throw new AppError(`Product with SKU '${skuFormatted}' already exists.`, 409);
    }

    const query = `
      INSERT INTO products (id, product_name, sku, category, unit_price, current_stock, min_stock_alert, location)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      id,
      data.product_name.trim(),
      skuFormatted,
      data.category.trim(),
      data.unit_price,
      data.current_stock ?? 0,
      data.min_stock_alert ?? 5,
      data.location ? data.location.trim() : null,
    ];

    const result = await db.query<Product>(query, values);
    const prod = result.rows[0];
    prod.unit_price = parseFloat(prod.unit_price as any);
    return prod;
  }

  static async updateProduct(id: string, data: any): Promise<Product> {
    await this.getProductById(id);

    if (data.sku) {
      const skuFormatted = data.sku.trim().toUpperCase();
      const existing = await db.query('SELECT id FROM products WHERE sku = $1 AND id != $2', [skuFormatted, id]);
      if (existing.rows.length > 0) {
        throw new AppError(`Product with SKU '${skuFormatted}' already exists.`, 409);
      }
      data.sku = skuFormatted;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let valCount = 1;

    const fields = ['product_name', 'sku', 'category', 'unit_price', 'current_stock', 'min_stock_alert', 'location'];

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
      UPDATE products
      SET ${updates.join(', ')}
      WHERE id = $${valCount}
      RETURNING *
    `;

    const result = await db.query<Product>(query, values);
    const prod = result.rows[0];
    prod.unit_price = parseFloat(prod.unit_price as any);
    return prod;
  }
}
