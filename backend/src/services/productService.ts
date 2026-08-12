import { query } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { Product, StockMovement, MovementType } from '../types';
import * as mem from './memoryStore';

export const getProducts = async (search?: string, category?: string, lowStock?: boolean) => {
  try {
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length} OR location ILIKE $${params.length})`;
    }

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (lowStock) {
      sql += ` AND current_stock <= min_stock_alert`;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    let data = [...mem.products];

    if (search) {
      const s = search.toLowerCase();
      data = data.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.location.toLowerCase().includes(s));
    }

    if (category) {
      data = data.filter(p => p.category === category);
    }

    if (lowStock) {
      data = data.filter(p => p.current_stock <= p.min_stock_alert);
    }

    return data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
};

export const getProductById = async (id: number): Promise<Product> => {
  try {
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new AppError('Product not found.', 404);
    }
    return result.rows[0];
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    const p = mem.products.find(p => p.id === id);
    if (!p) throw new AppError('Product not found.', 404);
    return p;
  }
};

export const createProduct = async (data: Partial<Product>): Promise<Product> => {
  try {
    const { name, sku, category, unit_price, current_stock, min_stock_alert, location } = data;

    // Check SKU uniqueness
    const existing = await query('SELECT id FROM products WHERE sku = $1', [sku]);
    if (existing.rows.length > 0) {
      throw new AppError(`Product with SKU '${sku}' already exists.`, 409);
    }

    const result = await query(
      `INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, sku, category, unit_price, current_stock || 0, min_stock_alert || 5, location]
    );

    return result.rows[0];
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    if (mem.products.some(p => p.sku.toLowerCase() === data.sku?.toLowerCase())) {
      throw new AppError(`Product with SKU '${data.sku}' already exists.`, 409);
    }
    const now = new Date();
    const p: Product = {
      id: mem.nextId.product(),
      name: data.name!,
      sku: data.sku!,
      category: data.category!,
      unit_price: Number(data.unit_price),
      current_stock: data.current_stock ?? 0,
      min_stock_alert: data.min_stock_alert ?? 5,
      location: data.location!,
      created_at: now,
      updated_at: now,
    };
    mem.products.push(p);
    return p;
  }
};

export const updateProduct = async (id: number, data: Partial<Product>): Promise<Product> => {
  try {
    await getProductById(id);

    const { name, sku, category, unit_price, current_stock, min_stock_alert, location } = data;

    if (sku) {
      const existing = await query('SELECT id FROM products WHERE sku = $1 AND id != $2', [sku, id]);
      if (existing.rows.length > 0) {
        throw new AppError(`Product with SKU '${sku}' already exists.`, 409);
      }
    }

    const result = await query(
      `UPDATE products
       SET name = $1, sku = $2, category = $3, unit_price = $4, current_stock = $5, min_stock_alert = $6, location = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [name, sku, category, unit_price, current_stock, min_stock_alert, location, id]
    );

    return result.rows[0];
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    const idx = mem.products.findIndex(p => p.id === id);
    if (idx === -1) throw new AppError('Product not found.', 404);
    if (data.sku && mem.products.some(p => p.sku.toLowerCase() === data.sku?.toLowerCase() && p.id !== id)) {
      throw new AppError(`Product with SKU '${data.sku}' already exists.`, 409);
    }
    const updated = { ...mem.products[idx], ...data, updated_at: new Date() };
    if (data.unit_price !== undefined) updated.unit_price = Number(data.unit_price);
    mem.products[idx] = updated;
    return updated;
  }
};

export const getStockMovements = async (productId?: number) => {
  try {
    let sql = `
      SELECT sm.*, p.name as product_name, p.sku as product_sku, u.name as created_by_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      JOIN users u ON sm.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (productId) {
      params.push(productId);
      sql += ` AND sm.product_id = $${params.length}`;
    }

    sql += ' ORDER BY sm.created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    let list = [...mem.stockMovements];
    if (productId) {
      list = list.filter(m => m.product_id === productId);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
};

export const addManualStockMovement = async (
  productId: number,
  quantity: number,
  movementType: MovementType,
  reason: string,
  userId: number
): Promise<StockMovement> => {
  try {
    const product = await getProductById(productId);

    if (movementType === 'OUT' && product.current_stock < quantity) {
      throw new AppError(
        `Insufficient stock. Available: ${product.current_stock}, Requested: ${quantity}. Stock cannot become negative.`,
        400
      );
    }

    const newStock = movementType === 'IN' 
      ? product.current_stock + quantity 
      : product.current_stock - quantity;

    await query(
      `UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newStock, productId]
    );

    const result = await query(
      `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [productId, quantity, movementType, reason, userId]
    );

    return result.rows[0];
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    const pIdx = mem.products.findIndex(p => p.id === productId);
    if (pIdx === -1) throw new AppError('Product not found.', 404);
    const prod = mem.products[pIdx];

    if (movementType === 'OUT' && prod.current_stock < quantity) {
      throw new AppError(
        `Insufficient stock. Available: ${prod.current_stock}, Requested: ${quantity}. Stock cannot become negative.`,
        400
      );
    }

    const newStock = movementType === 'IN' ? prod.current_stock + quantity : prod.current_stock - quantity;
    mem.products[pIdx].current_stock = newStock;
    mem.products[pIdx].updated_at = new Date();

    const user = mem.users.find(u => u.id === userId);
    const movement: StockMovement = {
      id: mem.nextId.movement(),
      product_id: productId,
      product_name: prod.name,
      product_sku: prod.sku,
      quantity,
      movement_type: movementType,
      reason,
      created_by: userId,
      created_by_name: user?.name || 'User',
      created_at: new Date(),
    };
    mem.stockMovements.push(movement);
    return movement;
  }
};
