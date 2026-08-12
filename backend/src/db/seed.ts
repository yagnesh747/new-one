import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db';

async function seedDatabase() {
  console.log('Starting Stockly database initialization & seeding...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Read and execute Schema DDL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    await client.query(schemaSql);
    console.log('Schema tables initialized.');

    // 2. Hash default password
    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    // 3. Seed Users
    const users = [
      { email: 'admin@example.com', name: 'System Administrator', role: 'Admin' },
      { email: 'sales@example.com', name: 'Rahul Sharma (Sales Executive)', role: 'Sales' },
      { email: 'warehouse@example.com', name: 'Vikram Singh (Warehouse Manager)', role: 'Warehouse' },
      { email: 'accounts@example.com', name: 'Priya Patel (Accounts Head)', role: 'Accounts' },
    ];

    const userMap: Record<string, number> = {};
    for (const u of users) {
      const res = await client.query(
        `INSERT INTO users (email, password_hash, name, role) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [u.email, defaultPasswordHash, u.name, u.role]
      );
      userMap[u.role] = res.rows[0].id;
    }
    console.log('Test users created for Admin, Sales, Warehouse, Accounts roles.');

    // 4. Seed Customers
    const customers = [
      {
        name: 'Apex Electricals Pvt Ltd',
        mobile: '+91 98200 12345',
        email: 'procurement@apexelectricals.com',
        business_name: 'Apex Electricals',
        gst_number: '27AAACA1234A1Z5',
        type: 'Wholesale',
        address: 'Plot 42, Industrial Area Phase 2, Mumbai, Maharashtra',
        status: 'Active',
        followup_date: '2026-08-20',
        notes: 'Requested bulk quote for circuit breakers and copper wiring.'
      },
      {
        name: 'Bharat Hardware & Tools',
        mobile: '+91 98765 43210',
        email: 'sales@bharathardware.in',
        business_name: 'Bharat Hardware Store',
        gst_number: '07BBBCC5678B1Z2',
        type: 'Retail',
        address: 'Shop 14, Main Market, Delhi, 110006',
        status: 'Active',
        followup_date: '2026-08-15',
        notes: 'Regular buyer of safety gloves and heavy duty drill sets.'
      },
      {
        name: 'Crown Industrial Supplies',
        mobile: '+91 97111 88899',
        email: 'info@crownindustrial.com',
        business_name: 'Crown Logistics & Supply',
        gst_number: '24CCCCD9012C1Z8',
        type: 'Distributor',
        address: 'GIDC Estate, Block B, Ahmedabad, Gujarat',
        status: 'Lead',
        followup_date: '2026-08-25',
        notes: 'New lead from trade expo. Interested in regional distribution partnership.'
      },
      {
        name: 'Metro Construction Components',
        mobile: '+91 99300 44556',
        email: 'orders@metroconst.com',
        business_name: 'Metro Infrastructure',
        gst_number: '29DDDEE3456D1Z1',
        type: 'Wholesale',
        address: '12th Cross, Peenya Industrial Area, Bengaluru, Karnataka',
        status: 'Active',
        followup_date: '2026-08-18',
        notes: 'Payment terms: Net 30. High volume monthly buyer.'
      },
      {
        name: 'Reliable Safety Equipment',
        mobile: '+91 91670 99000',
        email: 'contact@reliablesafety.in',
        business_name: 'Reliable Safety Mart',
        gst_number: '33EEEFF7890E1Z4',
        type: 'Retail',
        address: '45 Industrial Road, Chennai, Tamil Nadu',
        status: 'Inactive',
        followup_date: null,
        notes: 'Account dormant since last quarter.'
      }
    ];

    const customerIds: number[] = [];
    for (const c of customers) {
      const res = await client.query(
        `INSERT INTO customers (name, mobile, email, business_name, gst_number, type, address, status, followup_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [c.name, c.mobile, c.email, c.business_name, c.gst_number, c.type, c.address, c.status, c.followup_date, c.notes]
      );
      customerIds.push(res.rows[0].id);

      // Add initial followup note record
      if (c.notes) {
        await client.query(
          `INSERT INTO customer_followups (customer_id, note, created_by)
           VALUES ($1, $2, $3)`,
          [res.rows[0].id, c.notes, userMap['Sales']]
        );
      }
    }
    console.log('Sample customers and followups seeded.');

    // 5. Seed Products (Wholesale / Industrial / Hardware / Safety)
    const products = [
      {
        name: 'Industrial Circuit Breaker 32A 3-Phase',
        sku: 'ELEC-CB-032',
        category: 'Electrical',
        unit_price: 1450.00,
        current_stock: 45,
        min_stock_alert: 10,
        location: 'Warehouse A - Bay 3'
      },
      {
        name: 'Heavy Duty Copper Cable Wire 4sqmm (100m Roll)',
        sku: 'ELEC-CW-004',
        category: 'Electrical',
        unit_price: 3200.00,
        current_stock: 18,
        min_stock_alert: 5,
        location: 'Warehouse A - Bay 5'
      },
      {
        name: 'ANSI Industrial Safety Helmet (Yellow)',
        sku: 'SAFE-HLM-001',
        category: 'Safety Equipment',
        unit_price: 480.00,
        current_stock: 120,
        min_stock_alert: 25,
        location: 'Warehouse B - Rack 12'
      },
      {
        name: 'Cut-Resistant Protective Gloves (Pack of 10)',
        sku: 'SAFE-GLV-010',
        category: 'Safety Equipment',
        unit_price: 650.00,
        current_stock: 4,
        min_stock_alert: 15, // LOW STOCK TRIGGER DEMO!
        location: 'Warehouse B - Rack 14'
      },
      {
        name: 'Stainless Steel Hex Bolt M12 x 50mm (Box of 100)',
        sku: 'HARD-BLT-M12',
        category: 'Hardware',
        unit_price: 890.00,
        current_stock: 65,
        min_stock_alert: 20,
        location: 'Warehouse C - Shelf 4'
      },
      {
        name: 'High Performance Rotary Hammer Drill 800W',
        sku: 'HARD-DRL-800',
        category: 'Hardware',
        unit_price: 4950.00,
        current_stock: 12,
        min_stock_alert: 3,
        location: 'Warehouse A - Secure Vault'
      },
      {
        name: 'Industrial Grade Waterproof Sealant 310ml',
        sku: 'IND-SLT-310',
        category: 'Industrial Supplies',
        unit_price: 280.00,
        current_stock: 2,
        min_stock_alert: 10, // LOW STOCK TRIGGER DEMO!
        location: 'Warehouse C - Chemical Shelf'
      },
      {
        name: 'Digital Clamp Meter Multimeter 600V',
        sku: 'ELEC-MTR-600',
        category: 'Electrical',
        unit_price: 2250.00,
        current_stock: 30,
        min_stock_alert: 8,
        location: 'Warehouse A - Bay 1'
      }
    ];

    const productMap: Record<string, any> = {};
    for (const p of products) {
      const res = await client.query(
        `INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [p.name, p.sku, p.category, p.unit_price, p.current_stock, p.min_stock_alert, p.location]
      );
      const prod = res.rows[0];
      productMap[p.sku] = prod;

      // Add initial IN stock movement record
      await client.query(
        `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
         VALUES ($1, $2, 'IN', 'Initial Stock Opening Audit', $3)`,
        [prod.id, p.current_stock, userMap['Warehouse']]
      );
    }
    console.log('Sample products and initial IN stock movements seeded.');

    // 6. Seed Sample Sales Challans
    // Challan 1: Confirmed
    const p1 = productMap['ELEC-CB-032'];
    const p2 = productMap['HARD-BLT-M12'];
    const challan1Res = await client.query(
      `INSERT INTO challans (challan_number, customer_id, total_quantity, total_amount, status, created_by)
       VALUES ('CH-2026-0001', $1, 7, $2, 'Confirmed', $3) RETURNING id`,
      [customerIds[0], (p1.unit_price * 2) + (p2.unit_price * 5), userMap['Sales']]
    );
    const ch1Id = challan1Res.rows[0].id;
    await client.query(
      `INSERT INTO challan_items (challan_id, product_id, product_name, product_sku, unit_price, quantity)
       VALUES ($1, $2, $3, $4, $5, $6), ($1, $7, $8, $9, $10, $11)`,
      [ch1Id, p1.id, p1.name, p1.sku, p1.unit_price, 2, p2.id, p2.name, p2.sku, p2.unit_price, 5]
    );

    // Challan 2: Draft
    const p3 = productMap['SAFE-HLM-001'];
    const challan2Res = await client.query(
      `INSERT INTO challans (challan_number, customer_id, total_quantity, total_amount, status, created_by)
       VALUES ('CH-2026-0002', $1, 10, $2, 'Draft', $3) RETURNING id`,
      [customerIds[1], p3.unit_price * 10, userMap['Sales']]
    );
    const ch2Id = challan2Res.rows[0].id;
    await client.query(
      `INSERT INTO challan_items (challan_id, product_id, product_name, product_sku, unit_price, quantity)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [ch2Id, p3.id, p3.name, p3.sku, p3.unit_price, 10]
    );

    console.log('Sample sales challans seeded.');

    await client.query('COMMIT');
    console.log('Database seeding finished successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
