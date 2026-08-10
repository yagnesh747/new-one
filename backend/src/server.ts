import app from './app';
import { db } from './config/db';
import { hashPassword } from './utils/password';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function seedIfEmpty() {
  const usersResult = await db.query('SELECT COUNT(*) as count FROM users');
  const count = parseInt(usersResult.rows[0].count, 10);
  if (count > 0) {
    console.log(`Database already contains ${count} user(s). Skipping seed.`);
    return;
  }

  console.log('Empty database detected. Running auto-seed...');
  const pw = await hashPassword('password123');

  const users = [
    { id: 'u-admin-01', email: 'admin@example.com', full_name: 'Alexander Pierce (Admin)', role: 'Admin' },
    { id: 'u-sales-01', email: 'sales@example.com', full_name: 'Sarah Connor (Sales)', role: 'Sales' },
    { id: 'u-wh-01', email: 'warehouse@example.com', full_name: 'Marcus Vance (Warehouse)', role: 'Warehouse' },
    { id: 'u-acc-01', email: 'accounts@example.com', full_name: 'Elena Rostova (Accounts)', role: 'Accounts' },
  ];
  for (const u of users) {
    await db.query(
      `INSERT INTO users (id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING`,
      [u.id, u.email, pw, u.full_name, u.role]
    );
  }

  const customers = [
    { id: 'c-001', customer_name: 'Rajesh Kumar', mobile_number: '+91 9876543210', email: 'rajesh@apexdistributors.com', business_name: 'Apex Industrial Distributors', gst_number: '27AAACA1080P1ZP', customer_type: 'Distributor', address: 'Plot 45, Industrial Area Phase 2, Mumbai, MH', status: 'Active', follow_up_date: new Date(Date.now() + 86400000 * 3).toISOString(), notes: 'Key distributor for Western region.' },
    { id: 'c-002', customer_name: 'Anita Desai', mobile_number: '+91 9822011223', email: 'anita@metrotraders.in', business_name: 'Metro Wholesale Traders', gst_number: '07ABBCB2201Q1ZO', customer_type: 'Wholesale', address: 'B-12 Commercial Complex, Laxmi Nagar, Delhi, DL', status: 'Active', follow_up_date: new Date(Date.now() + 86400000 * 7).toISOString(), notes: 'Interested in bulk electronic components.' },
    { id: 'c-003', customer_name: 'Vikram Mehta', mobile_number: '+91 9711223344', email: 'vikram@sunrisestores.com', business_name: 'Sunrise Retail Hardware', gst_number: '29AABCS3312R1Z8', customer_type: 'Retail', address: 'Shop 104, Main Market, Indiranagar, Bengaluru, KA', status: 'Lead', follow_up_date: new Date(Date.now() + 86400000).toISOString(), notes: 'Sent initial pricing catalog.' },
    { id: 'c-004', customer_name: 'Priya Sharma', mobile_number: '+91 9988776655', email: 'priya@globaltraders.org', business_name: 'Global Trade Corp', gst_number: '19AAACG4411S1Z5', customer_type: 'Wholesale', address: '55 Park Street, Kolkata, WB', status: 'Inactive', follow_up_date: null, notes: 'Account inactive since last FY.' },
  ];
  for (const c of customers) {
    await db.query(
      `INSERT INTO customers (id, customer_name, mobile_number, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
      [c.id, c.customer_name, c.mobile_number, c.email, c.business_name, c.gst_number, c.customer_type, c.address, c.status, c.follow_up_date, c.notes]
    );
  }

  const products = [
    { id: 'p-001', product_name: 'Heavy Duty Power Drill 800W', sku: 'PWR-DRL-800', category: 'Power Tools', unit_price: 3450, current_stock: 45, min_stock_alert: 10, location: 'Aisle 3 - Shelf B' },
    { id: 'p-002', product_name: 'Industrial Safety Helmet - High Vis Yellow', sku: 'SAF-HLM-YEL', category: 'Safety Equipment', unit_price: 620, current_stock: 120, min_stock_alert: 25, location: 'Aisle 1 - Shelf A' },
    { id: 'p-003', product_name: 'Stainless Steel Fastener Kit (1000 Pcs)', sku: 'FAS-SSK-1000', category: 'Hardware', unit_price: 1850, current_stock: 4, min_stock_alert: 15, location: 'Aisle 5 - Shelf C' },
    { id: 'p-004', product_name: 'Digital Multimeter Pro 1000V', sku: 'ELE-MLT-1000', category: 'Electronics', unit_price: 2100, current_stock: 3, min_stock_alert: 10, location: 'Aisle 2 - Cabinet 4' },
    { id: 'p-005', product_name: 'Hydraulic Floor Jack 3 Ton', sku: 'HYD-JCK-3TN', category: 'Heavy Equipment', unit_price: 8900, current_stock: 18, min_stock_alert: 5, location: 'Zone C - Pallet 12' },
  ];
  for (const p of products) {
    await db.query(
      `INSERT INTO products (id, product_name, sku, category, unit_price, current_stock, min_stock_alert, location) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (sku) DO NOTHING`,
      [p.id, p.product_name, p.sku, p.category, p.unit_price, p.current_stock, p.min_stock_alert, p.location]
    );
  }

  const movements = [
    { id: 'sm-001', product_id: 'p-001', quantity_changed: 50, movement_type: 'IN', reason: 'Initial Vendor Shipment Batch #881', created_by: 'u-wh-01' },
    { id: 'sm-002', product_id: 'p-002', quantity_changed: 150, movement_type: 'IN', reason: 'Initial Vendor Shipment Batch #882', created_by: 'u-wh-01' },
    { id: 'sm-003', product_id: 'p-003', quantity_changed: 20, movement_type: 'IN', reason: 'Initial Stock Receiving', created_by: 'u-wh-01' },
    { id: 'sm-004', product_id: 'p-003', quantity_changed: 16, movement_type: 'OUT', reason: 'Sales Challan Confirmation #CH-2026-0001', created_by: 'u-sales-01' },
  ];
  for (const sm of movements) {
    await db.query(
      `INSERT INTO stock_movements (id, product_id, quantity_changed, movement_type, reason, created_by) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
      [sm.id, sm.product_id, sm.quantity_changed, sm.movement_type, sm.reason, sm.created_by]
    );
  }

  // Challan 1 - Confirmed
  await db.query(
    `INSERT INTO challans (id, challan_number, customer_id, total_quantity, total_amount, status, notes, created_by, confirmed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
    ['ch-001', 'CH-2026-0001', 'c-001', 21, 46850.00, 'Confirmed', 'Urgent site delivery.', 'u-sales-01', new Date(Date.now() - 86400000 * 2)]
  );
  await db.query(
    `INSERT INTO challan_items (id, challan_id, product_id, product_name, sku, unit_price, quantity, line_total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
    ['chi-001', 'ch-001', 'p-001', 'Heavy Duty Power Drill 800W', 'PWR-DRL-800', 3450, 5, 17250]
  );
  await db.query(
    `INSERT INTO challan_items (id, challan_id, product_id, product_name, sku, unit_price, quantity, line_total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
    ['chi-002', 'ch-001', 'p-003', 'Stainless Steel Fastener Kit (1000 Pcs)', 'FAS-SSK-1000', 1850, 16, 29600]
  );

  // Challan 2 - Draft
  await db.query(
    `INSERT INTO challans (id, challan_number, customer_id, total_quantity, total_amount, status, notes, created_by, confirmed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
    ['ch-002', 'CH-2026-0002', 'c-002', 10, 6200.00, 'Draft', 'Pending PO verification.', 'u-sales-01', null]
  );
  await db.query(
    `INSERT INTO challan_items (id, challan_id, product_id, product_name, sku, unit_price, quantity, line_total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
    ['chi-003', 'ch-002', 'p-002', 'Industrial Safety Helmet - High Vis Yellow', 'SAF-HLM-YEL', 620, 10, 6200]
  );

  console.log('Auto-seed completed successfully.');
}

async function startServer() {
  try {
    await db.init();
    await db.bootstrapSchema();
    await seedIfEmpty();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`Mini ERP + CRM Server running on port ${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
