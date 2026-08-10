import { db } from '../config/db';

export class DashboardService {
  static async getStats() {
    // Total & Active Customers
    const customerStats = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) as active
      FROM customers
    `);

    // Total Products & Low Stock Products
    const productStats = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN current_stock <= min_stock_alert THEN 1 END) as low_stock
      FROM products
    `);

    // Total Confirmed Challans Amount
    const challanStats = await db.query(`
      SELECT 
        COUNT(*) as total_challans,
        COUNT(CASE WHEN status = 'Confirmed' THEN 1 END) as confirmed_challans,
        COALESCE(SUM(CASE WHEN status = 'Confirmed' THEN total_amount ELSE 0 END), 0) as total_revenue
      FROM challans
    `);

    // Recent Stock Movements
    const recentMovements = await db.query(`
      SELECT sm.*, p.product_name, p.sku, u.full_name as created_by_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.created_by = u.id
      ORDER BY sm.created_at DESC
      LIMIT 5
    `);

    // Recent Challans
    const recentChallans = await db.query(`
      SELECT ch.*, c.customer_name, c.business_name
      FROM challans ch
      JOIN customers c ON ch.customer_id = c.id
      ORDER BY ch.created_at DESC
      LIMIT 5
    `);

    // Low Stock Alert Items List
    const lowStockItems = await db.query(`
      SELECT id, product_name, sku, category, unit_price, current_stock, min_stock_alert, location
      FROM products
      WHERE current_stock <= min_stock_alert
      ORDER BY current_stock ASC
      LIMIT 5
    `);

    return {
      customers: {
        total: parseInt(customerStats.rows[0].total, 10),
        active: parseInt(customerStats.rows[0].active, 10),
      },
      products: {
        total: parseInt(productStats.rows[0].total, 10),
        lowStockCount: parseInt(productStats.rows[0].low_stock, 10),
      },
      challans: {
        total: parseInt(challanStats.rows[0].total_challans, 10),
        confirmed: parseInt(challanStats.rows[0].confirmed_challans, 10),
        totalRevenue: parseFloat(challanStats.rows[0].total_revenue),
      },
      recentMovements: recentMovements.rows,
      recentChallans: recentChallans.rows.map((c) => ({
        ...c,
        total_amount: parseFloat(c.total_amount),
      })),
      lowStockItems: lowStockItems.rows.map((p) => ({
        ...p,
        unit_price: parseFloat(p.unit_price),
      })),
    };
  }
}
