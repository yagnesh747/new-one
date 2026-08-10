import { db } from '../config/db';
import { hashPassword } from '../utils/password';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  console.log('--- Seeding Mini ERP + CRM Database ---');

  try {
    await db.bootstrapSchema();

    // 1. Seed Users
    console.log('Seeding demo users...');
    const defaultPasswordHash = await hashPassword('password123');

    const users = [
      {
        id: 'u-admin-01',
        email: 'admin@example.com',
        password_hash: defaultPasswordHash,
        full_name: 'Alexander Pierce (Admin)',
        role: 'Admin',
      },
      {
        id: 'u-sales-01',
        email: 'sales@example.com',
        password_hash: defaultPasswordHash,
        full_name: 'Sarah Connor (Sales)',
        role: 'Sales',
      },
      {
        id: 'u-wh-01',
        email: 'warehouse@example.com',
        password_hash: defaultPasswordHash,
        full_name: 'Marcus Vance (Warehouse)',
        role: 'Warehouse',
      },
      {
        id: 'u-acc-01',
        email: 'accounts@example.com',
        password_hash: defaultPasswordHash,
        full_name: 'Elena Rostova (Accounts)',
        role: 'Accounts',
      },
    ];

    for (const u of users) {
      await db.query(
        `INSERT INTO users (id, email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, password_hash = EXCLUDED.password_hash`,
        [u.id, u.email, u.password_hash, u.full_name, u.role]
      );
    }

    // 2. Seed Customers
    console.log('Seeding demo customers...');
    const customers = [
      {
        id: 'c-001',
        customer_name: 'Rajesh Kumar',
        mobile_number: '+91 9876543210',
        email: 'rajesh@apexdistributors.com',
        business_name: 'Apex Industrial Distributors',
        gst_number: '27AAACA1080P1ZP',
        customer_type: 'Distributor',
        address: 'Plot 45, Industrial Area Phase 2, Mumbai, MH',
        status: 'Active',
        follow_up_date: new Date(Date.now() + 86400000 * 3).toISOString(),
        notes: 'Key distributor for Western region. High order volume quarterly.',
      },
      {
        id: 'c-002',
        customer_name: 'Anita Desai',
        mobile_number: '+91 9822011223',
        email: 'anita@metrotraders.in',
        business_name: 'Metro Wholesale Traders',
        gst_number: '07ABBCB2201Q1ZO',
        customer_type: 'Wholesale',
        address: 'B-12 Commercial Complex, Laxmi Nagar, Delhi, DL',
        status: 'Active',
        follow_up_date: new Date(Date.now() + 86400000 * 7).toISOString(),
        notes: 'Interested in bulk electronic components dispatch.',
      },
      {
        id: 'c-003',
        customer_name: 'Vikram Mehta',
        mobile_number: '+91 9711223344',
        email: 'vikram@sunrisestores.com',
        business_name: 'Sunrise Retail Hardware',
        gst_number: '29AABCS3312R1Z8',
        customer_type: 'Retail',
        address: 'Shop 104, Main Market, Indiranagar, Bengaluru, KA',
        status: 'Lead',
        follow_up_date: new Date(Date.now() + 86400000 * 1).toISOString(),
        notes: 'Sent initial pricing catalog. Awaiting sample approval.',
      },
      {
        id: 'c-004',
        customer_name: 'Priya Sharma',
        mobile_number: '+91 9988776655',
        email: 'priya@globaltraders.org',
        business_name: 'Global Trade Corp',
        gst_number: '19AAACG4411S1Z5',
        customer_type: 'Wholesale',
        address: '55 Park Street, Kolkata, WB',
        status: 'Inactive',
        follow_up_date: null,
        notes: 'Account inactive since last financial year review.',
      },
    ];

    for (const c of customers) {
      await db.query(
        `INSERT INTO customers (id, customer_name, mobile_number, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          c.id,
          c.customer_name,
          c.mobile_number,
          c.email,
          c.business_name,
          c.gst_number,
          c.customer_type,
          c.address,
          c.status,
          c.follow_up_date,
          c.notes,
        ]
      );
    }

    // 3. Seed Products
    console.log('Seeding demo products & stock...');
    const products = [
      {
        id: 'p-001',
        product_name: 'Heavy Duty Power Drill 800W',
        sku: 'PWR-DRL-800',
        category: 'Power Tools',
        unit_price: 3450.00,
        current_stock: 45,
        min_stock_alert: 10,
        location: 'Aisle 3 - Shelf B',
      },
      {
        id: 'p-002',
        product_name: 'Industrial Safety Helmet - High Vis Yellow',
        sku: 'SAF-HLM-YEL',
        category: 'Safety Equipment',
        unit_price: 620.00,
        current_stock: 120,
        min_stock_alert: 25,
        location: 'Aisle 1 - Shelf A',
      },
      {
        id: 'p-003',
        product_name: 'Stainless Steel Fastener Kit (1000 Pcs)',
        sku: 'FAS-SSK-1000',
        category: 'Hardware',
        unit_price: 1850.00,
        current_stock: 4, // LOW STOCK ALERT!
        min_stock_alert: 15,
        location: 'Aisle 5 - Shelf C',
      },
      {
        id: 'p-004',
        product_name: 'Digital Multimeter Pro 1000V',
        sku: 'ELE-MLT-1000',
        category: 'Electronics',
        unit_price: 2100.00,
        current_stock: 3, // LOW STOCK ALERT!
        min_stock_alert: 10,
        location: 'Aisle 2 - Cabinet 4',
      },
      {
        id: 'p-005',
        product_name: 'Hydraulic Floor Jack 3 Ton',
        sku: 'HYD-JCK-3TN',
        category: 'Heavy Equipment',
        unit_price: 8900.00,
        current_stock: 18,
        min_stock_alert: 5,
        location: 'Zone C - Pallet 12',
      },
    ];

    for (const p of products) {
      await db.query(
        `INSERT INTO products (id, product_name, sku, category, unit_price, current_stock, min_stock_alert, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (sku) DO NOTHING`,
        [p.id, p.product_name, p.sku, p.category, p.unit_price, p.current_stock, p.min_stock_alert, p.location]
      );
    }

    // 4. Seed Stock Movements
    console.log('Seeding initial stock movements...');
    const movements = [
      {
        id: 'sm-001',
        product_id: 'p-001',
        quantity_changed: 50,
        movement_type: 'IN',
        reason: 'Initial Vendor Shipment Batch #881',
        created_by: 'u-wh-01',
      },
      {
        id: 'sm-002',
        product_id: 'p-002',
        quantity_changed: 150,
        movement_type: 'IN',
        reason: 'Initial Vendor Shipment Batch #882',
        created_by: 'u-wh-01',
      },
      {
        id: 'sm-003',
        product_id: 'p-003',
        quantity_changed: 20,
        movement_type: 'IN',
        reason: 'Initial Stock Receiving',
        created_by: 'u-wh-01',
      },
      {
        id: 'sm-004',
        product_id: 'p-003',
        quantity_changed: 16,
        movement_type: 'OUT',
        reason: 'Sales Challan Confirmation #CH-2026-0001',
        created_by: 'u-sales-01',
      },
    ];

    for (const sm of movements) {
      await db.query(
        `INSERT INTO stock_movements (id, product_id, quantity_changed, movement_type, reason, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [sm.id, sm.product_id, sm.quantity_changed, sm.movement_type, sm.reason, sm.created_by]
      );
    }

    // 5. Seed Challans
    console.log('Seeding demo sales challans...');
    const challan1 = {
      id: 'ch-001',
      challan_number: 'CH-2026-0001',
      customer_id: 'c-001',
      total_quantity: 21,
      total_amount: 46850.00,
      status: 'Confirmed',
      notes: 'Urgent site delivery. Delivered via Express Cargo.',
      created_by: 'u-sales-01',
      confirmed_at: new Date(Date.now() - 86400000 * 2),
    };

    await db.query(
      `INSERT INTO challans (id, challan_number, customer_id, total_quantity, total_amount, status, notes, created_by, confirmed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        challan1.id,
        challan1.challan_number,
        challan1.customer_id,
        challan1.total_quantity,
        challan1.total_amount,
        challan1.status,
        challan1.notes,
        challan1.created_by,
        challan1.confirmed_at,
      ]
    );

    const items1 = [
      {
        id: 'chi-001',
        challan_id: 'ch-001',
        product_id: 'p-001',
        product_name: 'Heavy Duty Power Drill 800W',
        sku: 'PWR-DRL-800',
        unit_price: 3450.00,
        quantity: 5,
        line_total: 17250.00,
      },
      {
        id: 'chi-002',
        challan_id: 'ch-001',
        product_id: 'p-003',
        product_name: 'Stainless Steel Fastener Kit (1000 Pcs)',
        sku: 'FAS-SSK-1000',
        unit_price: 1850.00,
        quantity: 16,
        line_total: 29600.00,
      },
    ];

    for (const item of items1) {
      await db.query(
        `INSERT INTO challan_items (id, challan_id, product_id, product_name, sku, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [item.id, item.challan_id, item.product_id, item.product_name, item.sku, item.unit_price, item.quantity, item.line_total]
      );
    }

    const challan2 = {
      id: 'ch-002',
      challan_number: 'CH-2026-0002',
      customer_id: 'c-002',
      total_quantity: 10,
      total_amount: 6200.00,
      status: 'Draft',
      notes: 'Pending purchase order verification from client accounts.',
      created_by: 'u-sales-01',
      confirmed_at: null,
    };

    await db.query(
      `INSERT INTO challans (id, challan_number, customer_id, total_quantity, total_amount, status, notes, created_by, confirmed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        challan2.id,
        challan2.challan_number,
        challan2.customer_id,
        challan2.total_quantity,
        challan2.total_amount,
        challan2.status,
        challan2.notes,
        challan2.created_by,
        challan2.confirmed_at,
      ]
    );

    const items2 = [
      {
        id: 'chi-003',
        challan_id: 'ch-002',
        product_id: 'p-002',
        product_name: 'Industrial Safety Helmet - High Vis Yellow',
        sku: 'SAF-HLM-YEL',
        unit_price: 620.00,
        quantity: 10,
        line_total: 6200.00,
      },
    ];

    for (const item of items2) {
      await db.query(
        `INSERT INTO challan_items (id, challan_id, product_id, product_name, sku, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [item.id, item.challan_id, item.product_id, item.product_name, item.sku, item.unit_price, item.quantity, item.line_total]
      );
    }

    console.log('--- Database Seeding Completed Successfully! ---');
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  }
}

seed();
