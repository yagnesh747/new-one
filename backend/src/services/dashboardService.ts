import { query } from '../config/db';
import * as mem from './memoryStore';

const parseFloatValue = (value: any) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value) || 0;
};

const buildRecentMonths = (months = 12) => {
  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(currentMonth);
    date.setMonth(currentMonth.getMonth() - (months - 1 - index));
    return {
      month: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      revenue: 0,
      order_count: 0,
    };
  });
};

export const getDashboardSummary = async () => {
  try {
    const [custRes, prodRes, challanRes, revenueRes, pendingRes, lowStockRes] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM customers'),
      query('SELECT COUNT(*)::int AS count FROM products'),
      query('SELECT COUNT(*)::int AS count FROM challans'),
      query("SELECT COALESCE(SUM(total_amount), 0)::float AS total_revenue FROM challans WHERE status = 'Confirmed'"),
      query("SELECT COALESCE(SUM(total_amount), 0)::float AS pending_payments FROM challans WHERE status = 'Draft'"),
      query('SELECT COUNT(*)::int AS count FROM products WHERE current_stock <= min_stock_alert'),
    ]);

    return {
      totalCustomers: custRes.rows[0].count,
      totalProducts: prodRes.rows[0].count,
      totalChallans: challanRes.rows[0].count,
      totalRevenue: parseFloatValue(revenueRes.rows[0].total_revenue),
      pendingPayments: parseFloatValue(pendingRes.rows[0].pending_payments),
      lowStockCount: lowStockRes.rows[0].count,
    };
  } catch (err: any) {
    const totalCustomers = mem.customers.length;
    const totalProducts = mem.products.length;
    const totalChallans = mem.challans.length;
    const totalRevenue = mem.challans
      .filter((challan) => challan.status === 'Confirmed')
      .reduce((sum, challan) => sum + challan.total_amount, 0);
    const pendingPayments = mem.challans
      .filter((challan) => challan.status === 'Draft')
      .reduce((sum, challan) => sum + challan.total_amount, 0);
    const lowStockCount = mem.products.filter((p) => p.current_stock <= p.min_stock_alert).length;

    return {
      totalCustomers,
      totalProducts,
      totalChallans,
      totalRevenue,
      pendingPayments,
      lowStockCount,
    };
  }
};

export const getLowStockProducts = async () => {
  try {
    const res = await query(
      `SELECT id, name, sku, current_stock, min_stock_alert, location
       FROM products
       WHERE current_stock <= min_stock_alert
       ORDER BY current_stock ASC, min_stock_alert ASC
       LIMIT 10`
    );
    return res.rows;
  } catch (err: any) {
    return [...mem.products]
      .filter((product) => product.current_stock <= product.min_stock_alert)
      .sort((a, b) => a.current_stock - b.current_stock || a.min_stock_alert - b.min_stock_alert)
      .slice(0, 10)
      .map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        current_stock: product.current_stock,
        min_stock_alert: product.min_stock_alert,
        location: product.location,
      }));
  }
};

export const getRecentActivity = async () => {
  try {
    const res = await query(
      `SELECT c.id, c.challan_number, c.total_amount, c.total_quantity, c.status, c.created_at,
              cust.name as customer_name, cust.business_name as customer_business
       FROM challans c
       JOIN customers cust ON c.customer_id = cust.id
       ORDER BY c.created_at DESC
       LIMIT 8`
    );
    return res.rows;
  } catch (err: any) {
    return [...mem.challans]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8)
      .map((challan) => ({
        id: challan.id,
        challan_number: challan.challan_number,
        total_amount: challan.total_amount,
        total_quantity: challan.total_quantity,
        status: challan.status,
        created_at: challan.created_at,
        customer_name: challan.customer_name,
        customer_business: challan.customer_business,
      }));
  }
};

export const getSalesSummary = async () => {
  try {
    const res = await query(
      `SELECT to_char(series, 'YYYY-MM') as month,
              to_char(series, 'Mon YY') as label,
              COALESCE(s.revenue, 0)::float as revenue,
              COALESCE(s.order_count, 0)::int as order_count
       FROM generate_series(
         date_trunc('month', current_date) - interval '11 months',
         date_trunc('month', current_date),
         interval '1 month'
       ) as series
       LEFT JOIN (
         SELECT date_trunc('month', created_at) as month,
                COUNT(*) as order_count,
                SUM(total_amount) as revenue
         FROM challans
         WHERE status = 'Confirmed'
         GROUP BY date_trunc('month', created_at)
       ) s ON s.month = series
       ORDER BY series`
    );
    return res.rows.map((row) => ({
      month: row.month,
      label: row.label,
      revenue: parseFloatValue(row.revenue),
      order_count: row.order_count,
    }));
  } catch (err: any) {
    const history = buildRecentMonths(12);
    mem.challans
      .filter((challan) => challan.status === 'Confirmed')
      .forEach((challan) => {
        const created = new Date(challan.created_at);
        const monthKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
        const month = history.find((item) => item.month === monthKey);
        if (month) {
          month.revenue += challan.total_amount;
          month.order_count += 1;
        }
      });
    return history;
  }
};

export const getTopCustomers = async () => {
  try {
    const [topRes, recentRes] = await Promise.all([
      query(
        `SELECT cust.id, cust.name, cust.business_name, COALESCE(SUM(c.total_amount), 0)::float as total_sales,
                COUNT(*)::int as orders
         FROM customers cust
         JOIN challans c ON c.customer_id = cust.id
         WHERE c.status = 'Confirmed'
         GROUP BY cust.id, cust.name, cust.business_name
         ORDER BY total_sales DESC
         LIMIT 6`
      ),
      query(
        `SELECT id, name, business_name, created_at
         FROM customers
         ORDER BY created_at DESC
         LIMIT 6`
      ),
    ]);

    return {
      topCustomers: topRes.rows.map((row) => ({
        id: row.id,
        name: row.name,
        business_name: row.business_name,
        total_sales: parseFloatValue(row.total_sales),
        orders: row.orders,
      })),
      recentCustomers: recentRes.rows,
    };
  } catch (err: any) {
    const topCustomers = Object.values(
      mem.challans
        .filter((challan) => challan.status === 'Confirmed')
        .reduce((acc, challan) => {
          if (!acc[challan.customer_id]) {
            const customer = mem.customers.find((c) => c.id === challan.customer_id);
            acc[challan.customer_id] = {
              id: challan.customer_id,
              name: customer?.name || 'Unknown',
              business_name: customer?.business_name || 'Unknown Business',
              total_sales: 0,
              orders: 0,
            };
          }
          acc[challan.customer_id].total_sales += challan.total_amount;
          acc[challan.customer_id].orders += 1;
          return acc;
        }, {} as Record<number, { id: number; name: string; business_name: string; total_sales: number; orders: number }>)
    ).sort((a, b) => b.total_sales - a.total_sales).slice(0, 6);

    const recentCustomers = [...mem.customers]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)
      .map((customer) => ({
        id: customer.id,
        name: customer.name,
        business_name: customer.business_name,
        created_at: customer.created_at,
      }));

    return { topCustomers, recentCustomers };
  }
};

export const getDashboardStats = getDashboardSummary;
