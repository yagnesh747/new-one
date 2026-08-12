import { pool, query } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { Challan, ChallanItem } from '../types';
import * as mem from './memoryStore';

const generateChallanNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `CH-${currentYear}-`;

  try {
    const result = await query(
      `SELECT challan_number FROM challans WHERE challan_number LIKE $1 ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );

    if (result.rows.length === 0) {
      return `${prefix}0001`;
    }

    const lastNumStr = result.rows[0].challan_number.replace(prefix, '');
    const nextNum = parseInt(lastNumStr, 10) + 1;
    return `${prefix}${nextNum.toString().padStart(4, '0')}`;
  } catch (err) {
    const existing = mem.challans.filter(c => c.challan_number.startsWith(prefix));
    if (existing.length === 0) return `${prefix}0001`;
    const lastNumStr = existing[existing.length - 1].challan_number.replace(prefix, '');
    const nextNum = parseInt(lastNumStr, 10) + 1;
    return `${prefix}${nextNum.toString().padStart(4, '0')}`;
  }
};

export const getChallans = async (search?: string, status?: string) => {
  try {
    let sql = `
      SELECT c.*, cust.name as customer_name, cust.business_name as customer_business, u.name as created_by_name
      FROM challans c
      JOIN customers cust ON c.customer_id = cust.id
      JOIN users u ON c.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (c.challan_number ILIKE $${params.length} OR cust.name ILIKE $${params.length} OR cust.business_name ILIKE $${params.length})`;
    }

    if (status) {
      params.push(status);
      sql += ` AND c.status = $${params.length}`;
    }

    sql += ' ORDER BY c.created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    let list = [...mem.challans];

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c =>
        c.challan_number.toLowerCase().includes(s) ||
        (c.customer_name && c.customer_name.toLowerCase().includes(s)) ||
        (c.customer_business && c.customer_business.toLowerCase().includes(s))
      );
    }

    if (status) {
      list = list.filter(c => c.status === status);
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
};

export const getChallanById = async (id: number): Promise<Challan> => {
  try {
    const challanRes = await query(
      `SELECT c.*, cust.name as customer_name, cust.business_name as customer_business, u.name as created_by_name
       FROM challans c
       JOIN customers cust ON c.customer_id = cust.id
       JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (challanRes.rows.length === 0) {
      throw new AppError('Sales Challan not found.', 404);
    }

    const itemsRes = await query(
      `SELECT ci.*
       FROM challan_items ci
       WHERE ci.challan_id = $1`,
      [id]
    );

    const challan = challanRes.rows[0];
    challan.items = itemsRes.rows;
    return challan;
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    const c = mem.challans.find(c => c.id === id);
    if (!c) throw new AppError('Sales Challan not found.', 404);
    const items = mem.challanItems.filter(i => i.challan_id === id);
    return { ...c, items };
  }
};

export const createChallan = async (
  data: { customer_id: number; status: 'Draft' | 'Confirmed'; items: { product_id: number; quantity: number }[] },
  userId: number
): Promise<Challan> => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const customerRes = await client.query('SELECT id FROM customers WHERE id = $1', [data.customer_id]);
      if (customerRes.rows.length === 0) {
        throw new AppError('Selected customer does not exist.', 404);
      }

      const productSnapshots: { product_id: number; name: string; sku: string; unit_price: number; quantity: number; current_stock: number }[] = [];
      let totalQty = 0;
      let totalAmount = 0;

      for (const item of data.items) {
        const prodRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
        if (prodRes.rows.length === 0) {
          throw new AppError(`Product ID ${item.product_id} not found.`, 404);
        }
        const prod = prodRes.rows[0];

        if (data.status === 'Confirmed') {
          if (prod.current_stock < item.quantity) {
            throw new AppError(
              `Insufficient stock for product '${prod.name}' (SKU: ${prod.sku}). Available: ${prod.current_stock}, Requested: ${item.quantity}.`,
              400
            );
          }
        }

        const itemTotal = Number(prod.unit_price) * item.quantity;
        totalQty += item.quantity;
        totalAmount += itemTotal;

        productSnapshots.push({
          product_id: prod.id,
          name: prod.name,
          sku: prod.sku,
          unit_price: Number(prod.unit_price),
          quantity: item.quantity,
          current_stock: prod.current_stock,
        });
      }

      const challanNumber = await generateChallanNumber();

      const challanRes = await client.query(
        `INSERT INTO challans (challan_number, customer_id, total_quantity, total_amount, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [challanNumber, data.customer_id, totalQty, totalAmount, data.status, userId]
      );

      const newChallan = challanRes.rows[0];

      for (const item of productSnapshots) {
        await client.query(
          `INSERT INTO challan_items (challan_id, product_id, product_name, product_sku, unit_price, quantity)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newChallan.id, item.product_id, item.name, item.sku, item.unit_price, item.quantity]
        );

        if (data.status === 'Confirmed') {
          const newStock = item.current_stock - item.quantity;
          await client.query('UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
            newStock,
            item.product_id,
          ]);

          await client.query(
            `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
             VALUES ($1, $2, 'OUT', $3, $4)`,
            [item.product_id, item.quantity, `Sales Challan #${challanNumber}`, userId]
          );
        }
      }

      await client.query('COMMIT');
      return getChallanById(newChallan.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (err instanceof AppError) throw err;

    // Fallback logic
    const cust = mem.customers.find(c => c.id === data.customer_id);
    if (!cust) throw new AppError('Selected customer does not exist.', 404);

    const itemsToCreate: ChallanItem[] = [];
    let totalQty = 0;
    let totalAmount = 0;

    for (const item of data.items) {
      const prod = mem.products.find(p => p.id === item.product_id);
      if (!prod) throw new AppError(`Product ID ${item.product_id} not found.`, 404);

      if (data.status === 'Confirmed') {
        if (prod.current_stock < item.quantity) {
          throw new AppError(
            `Insufficient stock for product '${prod.name}' (SKU: ${prod.sku}). Available: ${prod.current_stock}, Requested: ${item.quantity}.`,
            400
          );
        }
      }

      const itemTotal = Number(prod.unit_price) * item.quantity;
      totalQty += item.quantity;
      totalAmount += itemTotal;

      itemsToCreate.push({
        id: mem.nextId.challanItem(),
        product_id: prod.id,
        product_name: prod.name,
        product_sku: prod.sku,
        unit_price: Number(prod.unit_price),
        quantity: item.quantity,
      });
    }

    const challanNumber = await generateChallanNumber();
    const newChallanId = mem.nextId.challan();
    const user = mem.users.find(u => u.id === userId);
    const now = new Date();

    const newChallan: Challan = {
      id: newChallanId,
      challan_number: challanNumber,
      customer_id: cust.id,
      customer_name: cust.name,
      customer_business: cust.business_name,
      total_quantity: totalQty,
      total_amount: totalAmount,
      status: data.status,
      created_by: userId,
      created_by_name: user?.name || 'User',
      created_at: now,
      updated_at: now,
      items: itemsToCreate.map(i => ({ ...i, challan_id: newChallanId })),
    };

    mem.challans.push(newChallan);
    itemsToCreate.forEach(i => {
      mem.challanItems.push({ ...i, challan_id: newChallanId });
    });

    if (data.status === 'Confirmed') {
      for (const item of itemsToCreate) {
        const pIdx = mem.products.findIndex(p => p.id === item.product_id);
        if (pIdx !== -1) {
          mem.products[pIdx].current_stock -= item.quantity;
          mem.products[pIdx].updated_at = new Date();
        }

        mem.stockMovements.push({
          id: mem.nextId.movement(),
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: item.quantity,
          movement_type: 'OUT',
          reason: `Sales Challan #${challanNumber}`,
          created_by: userId,
          created_by_name: user?.name || 'User',
          created_at: new Date(),
        });
      }
    }

    return newChallan;
  }
};

export const updateDraftChallan = async (
  id: number,
  data: { customer_id: number; items: { product_id: number; quantity: number }[] }
): Promise<Challan> => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existingRes = await client.query('SELECT * FROM challans WHERE id = $1 FOR UPDATE', [id]);
      if (existingRes.rows.length === 0) {
        throw new AppError('Challan not found.', 404);
      }
      const existingChallan = existingRes.rows[0];

      if (existingChallan.status !== 'Draft') {
        throw new AppError(`Cannot edit a challan with status '${existingChallan.status}'. Only Draft challans can be edited.`, 400);
      }

      await client.query('DELETE FROM challan_items WHERE challan_id = $1', [id]);

      let totalQty = 0;
      let totalAmount = 0;

      for (const item of data.items) {
        const prodRes = await client.query('SELECT * FROM products WHERE id = $1', [item.product_id]);
        if (prodRes.rows.length === 0) {
          throw new AppError(`Product ID ${item.product_id} not found.`, 404);
        }
        const prod = prodRes.rows[0];

        const itemTotal = Number(prod.unit_price) * item.quantity;
        totalQty += item.quantity;
        totalAmount += itemTotal;

        await client.query(
          `INSERT INTO challan_items (challan_id, product_id, product_name, product_sku, unit_price, quantity)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, prod.id, prod.name, prod.sku, prod.unit_price, item.quantity]
        );
      }

      await client.query(
        `UPDATE challans
         SET customer_id = $1, total_quantity = $2, total_amount = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [data.customer_id, totalQty, totalAmount, id]
      );

      await client.query('COMMIT');
      return getChallanById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (err instanceof AppError) throw err;

    const cIdx = mem.challans.findIndex(c => c.id === id);
    if (cIdx === -1) throw new AppError('Challan not found.', 404);
    if (mem.challans[cIdx].status !== 'Draft') {
      throw new AppError(`Cannot edit a challan with status '${mem.challans[cIdx].status}'. Only Draft challans can be edited.`, 400);
    }

    const cust = mem.customers.find(c => c.id === data.customer_id);
    if (!cust) throw new AppError('Customer not found.', 404);

    // Filter out old items
    for (let i = mem.challanItems.length - 1; i >= 0; i--) {
      if (mem.challanItems[i].challan_id === id) {
        mem.challanItems.splice(i, 1);
      }
    }

    let totalQty = 0;
    let totalAmount = 0;
    const newItems: ChallanItem[] = [];

    for (const item of data.items) {
      const prod = mem.products.find(p => p.id === item.product_id);
      if (!prod) throw new AppError(`Product ID ${item.product_id} not found.`, 404);

      const itemTotal = Number(prod.unit_price) * item.quantity;
      totalQty += item.quantity;
      totalAmount += itemTotal;

      const ci: ChallanItem = {
        id: mem.nextId.challanItem(),
        challan_id: id,
        product_id: prod.id,
        product_name: prod.name,
        product_sku: prod.sku,
        unit_price: Number(prod.unit_price),
        quantity: item.quantity,
      };
      mem.challanItems.push(ci);
      newItems.push(ci);
    }

    mem.challans[cIdx].customer_id = cust.id;
    mem.challans[cIdx].customer_name = cust.name;
    mem.challans[cIdx].customer_business = cust.business_name;
    mem.challans[cIdx].total_quantity = totalQty;
    mem.challans[cIdx].total_amount = totalAmount;
    mem.challans[cIdx].updated_at = new Date();
    mem.challans[cIdx].items = newItems;

    return mem.challans[cIdx];
  }
};

export const confirmChallan = async (id: number, userId: number): Promise<Challan> => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const challanRes = await client.query('SELECT * FROM challans WHERE id = $1 FOR UPDATE', [id]);
      if (challanRes.rows.length === 0) {
        throw new AppError('Sales Challan not found.', 404);
      }

      const challan = challanRes.rows[0];

      if (challan.status === 'Confirmed') {
        throw new AppError('This challan is already confirmed. Stock deduction has already been processed.', 400);
      }

      if (challan.status === 'Cancelled') {
        throw new AppError('Cannot confirm a cancelled challan.', 400);
      }

      const itemsRes = await client.query('SELECT * FROM challan_items WHERE challan_id = $1', [id]);
      const items: ChallanItem[] = itemsRes.rows;

      if (items.length === 0) {
        throw new AppError('Challan has no items to confirm.', 400);
      }

      for (const item of items) {
        const prodRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
        if (prodRes.rows.length === 0) {
          throw new AppError(`Product '${item.product_name}' (ID: ${item.product_id}) no longer exists.`, 404);
        }

        const product = prodRes.rows[0];

        if (product.current_stock < item.quantity) {
          throw new AppError(
            `Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Available: ${product.current_stock}, Requested: ${item.quantity}.`,
            400
          );
        }
      }

      for (const item of items) {
        const prodRes = await client.query('SELECT current_stock FROM products WHERE id = $1', [item.product_id]);
        const currentStock = prodRes.rows[0].current_stock;
        const newStock = currentStock - item.quantity;

        await client.query('UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
          newStock,
          item.product_id,
        ]);

        await client.query(
          `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
           VALUES ($1, $2, 'OUT', $3, $4)`,
          [item.product_id, item.quantity, `Sales Challan #${challan.challan_number}`, userId]
        );
      }

      await client.query(
        `UPDATE challans SET status = 'Confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );

      await client.query('COMMIT');
      return getChallanById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (err instanceof AppError) throw err;

    const cIdx = mem.challans.findIndex(c => c.id === id);
    if (cIdx === -1) throw new AppError('Sales Challan not found.', 404);
    const challan = mem.challans[cIdx];

    if (challan.status === 'Confirmed') {
      throw new AppError('This challan is already confirmed. Stock deduction has already been processed.', 400);
    }
    if (challan.status === 'Cancelled') {
      throw new AppError('Cannot confirm a cancelled challan.', 400);
    }

    const items = mem.challanItems.filter(i => i.challan_id === id);
    if (items.length === 0) {
      throw new AppError('Challan has no items to confirm.', 400);
    }

    for (const item of items) {
      const prod = mem.products.find(p => p.id === item.product_id);
      if (!prod) {
        throw new AppError(`Product '${item.product_name}' (ID: ${item.product_id}) no longer exists.`, 404);
      }

      if (prod.current_stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for product '${prod.name}' (SKU: ${prod.sku}). Available: ${prod.current_stock}, Requested: ${item.quantity}.`,
          400
        );
      }
    }

    const user = mem.users.find(u => u.id === userId);
    for (const item of items) {
      const pIdx = mem.products.findIndex(p => p.id === item.product_id);
      if (pIdx !== -1) {
        mem.products[pIdx].current_stock -= item.quantity;
        mem.products[pIdx].updated_at = new Date();
      }

      mem.stockMovements.push({
        id: mem.nextId.movement(),
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        movement_type: 'OUT',
        reason: `Sales Challan #${challan.challan_number}`,
        created_by: userId,
        created_by_name: user?.name || 'User',
        created_at: new Date(),
      });
    }

    mem.challans[cIdx].status = 'Confirmed';
    mem.challans[cIdx].updated_at = new Date();

    return { ...mem.challans[cIdx], items };
  }
};

export const cancelChallan = async (id: number): Promise<Challan> => {
  try {
    const challan = await getChallanById(id);
    if (challan.status === 'Confirmed') {
      throw new AppError('Cannot cancel an already confirmed sales challan.', 400);
    }

    await query(`UPDATE challans SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
    return getChallanById(id);
  } catch (err: any) {
    if (err instanceof AppError) throw err;

    const cIdx = mem.challans.findIndex(c => c.id === id);
    if (cIdx === -1) throw new AppError('Sales Challan not found.', 404);
    if (mem.challans[cIdx].status === 'Confirmed') {
      throw new AppError('Cannot cancel an already confirmed sales challan.', 400);
    }

    mem.challans[cIdx].status = 'Cancelled';
    mem.challans[cIdx].updated_at = new Date();
    return mem.challans[cIdx];
  }
};
