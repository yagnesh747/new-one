/**
 * In-memory data store for Stockly. Used when PostgreSQL is unavailable.
 * Pre-populated with realistic demo data so the app works out of the box.
 */

import { User, Customer, Product, StockMovement, Challan, ChallanItem, CustomerFollowup, AuthUserPayload } from '../types';
import bcrypt from 'bcryptjs';

const now = new Date();
const ago = (days: number) => new Date(Date.now() - days * 86400000);

// ─── Users ───────────────────────────────────────────────────────────────────
const passwordHash = bcrypt.hashSync('password123', 10);

export const users: (User & { rawPassword?: string })[] = [
  { id: 1, name: 'Rajesh Kumar', email: 'admin@example.com', password_hash: passwordHash, role: 'Admin', created_at: ago(90), updated_at: ago(90) },
  { id: 2, name: 'Priya Sharma', email: 'sales@example.com', password_hash: passwordHash, role: 'Sales', created_at: ago(85), updated_at: ago(85) },
  { id: 3, name: 'Amit Patel', email: 'warehouse@example.com', password_hash: passwordHash, role: 'Warehouse', created_at: ago(80), updated_at: ago(80) },
  { id: 4, name: 'Neha Gupta', email: 'accounts@example.com', password_hash: passwordHash, role: 'Accounts', created_at: ago(75), updated_at: ago(75) },
];

// ─── Customers ───────────────────────────────────────────────────────────────
export const customers: Customer[] = [
  { id: 1, name: 'Vikram Industries', mobile: '9876543210', email: 'vikram@industries.com', business_name: 'Vikram Industries Pvt Ltd', gst_number: '27AABCV1234H1ZS', type: 'Wholesale', address: '42, Industrial Area, Phase-II, Chandigarh', status: 'Active', followup_date: null, notes: 'Major wholesale buyer, monthly orders', created_at: ago(60), updated_at: ago(5) },
  { id: 2, name: 'Meera Textiles', mobile: '9988776655', email: 'meera@textiles.in', business_name: 'Meera Textiles & Co', gst_number: '24AABCM5678K1ZP', type: 'Distributor', address: '15, Textile Market, Surat, Gujarat', status: 'Active', followup_date: null, notes: 'Regional distributor for Gujarat', created_at: ago(55), updated_at: ago(3) },
  { id: 3, name: 'Arjun Traders', mobile: '9112233445', email: 'arjun@traders.com', business_name: 'Arjun Traders', gst_number: null, type: 'Retail', address: '78, MG Road, Bengaluru, Karnataka', status: 'Lead', followup_date: '2026-08-20', notes: 'Interested in bulk purchase, send quotation', created_at: ago(30), updated_at: ago(10) },
  { id: 4, name: 'Lakshmi Enterprises', mobile: '9223344556', email: 'lakshmi@enterprises.co', business_name: 'Lakshmi Enterprises', gst_number: '33AABCL9012N1ZQ', type: 'Wholesale', address: '201, Anna Salai, Chennai, Tamil Nadu', status: 'Active', followup_date: null, notes: 'Quarterly orders, good credit history', created_at: ago(45), updated_at: ago(7) },
  { id: 5, name: 'Rohan Suppliers', mobile: '9334455667', email: 'rohan@suppliers.in', business_name: 'Rohan Suppliers & Sons', gst_number: null, type: 'Retail', address: '55, Nehru Place, New Delhi', status: 'Inactive', followup_date: null, notes: 'Last order 3 months ago', created_at: ago(90), updated_at: ago(45) },
  { id: 6, name: 'Sunita Agencies', mobile: '9445566778', email: 'sunita@agencies.com', business_name: 'Sunita Marketing Agencies', gst_number: '29AABCS3456R1ZT', type: 'Distributor', address: '12, Brigade Road, Bengaluru, Karnataka', status: 'Active', followup_date: '2026-08-15', notes: 'Key distributor for South India', created_at: ago(50), updated_at: ago(2) },
];

// ─── Products ────────────────────────────────────────────────────────────────
export const products: Product[] = [
  { id: 1, name: 'Premium Cotton Fabric', sku: 'FAB-COT-001', category: 'Fabrics', unit_price: 450, current_stock: 1200, min_stock_alert: 200, location: 'Warehouse A - Rack 1', created_at: ago(60), updated_at: ago(2) },
  { id: 2, name: 'Silk Blend Yarn', sku: 'YRN-SLK-002', category: 'Yarns', unit_price: 890, current_stock: 350, min_stock_alert: 100, location: 'Warehouse A - Rack 3', created_at: ago(55), updated_at: ago(5) },
  { id: 3, name: 'Industrial Thread Spool', sku: 'THR-IND-003', category: 'Threads', unit_price: 120, current_stock: 5000, min_stock_alert: 500, location: 'Warehouse B - Rack 1', created_at: ago(50), updated_at: ago(1) },
  { id: 4, name: 'Polyester Resin', sku: 'CHM-PLY-004', category: 'Chemicals', unit_price: 1200, current_stock: 80, min_stock_alert: 50, location: 'Warehouse C - Section 2', created_at: ago(45), updated_at: ago(8) },
  { id: 5, name: 'Brass Fittings Set', sku: 'HDW-BRS-005', category: 'Hardware', unit_price: 650, current_stock: 420, min_stock_alert: 100, location: 'Warehouse B - Rack 5', created_at: ago(40), updated_at: ago(3) },
  { id: 6, name: 'Packaging Boxes (Large)', sku: 'PKG-BOX-006', category: 'Packaging', unit_price: 45, current_stock: 3000, min_stock_alert: 500, location: 'Warehouse D - Section 1', created_at: ago(35), updated_at: ago(1) },
  { id: 7, name: 'Dye Pigment Red', sku: 'DYE-RED-007', category: 'Chemicals', unit_price: 780, current_stock: 45, min_stock_alert: 50, location: 'Warehouse C - Section 1', created_at: ago(30), updated_at: ago(10) },
  { id: 8, name: 'Steel Bolts M10', sku: 'HDW-STL-008', category: 'Hardware', unit_price: 15, current_stock: 8000, min_stock_alert: 1000, location: 'Warehouse B - Rack 2', created_at: ago(25), updated_at: ago(4) },
];

// ─── Stock Movements ────────────────────────────────────────────────────────
export const stockMovements: StockMovement[] = [
  { id: 1, product_id: 1, product_name: 'Premium Cotton Fabric', product_sku: 'FAB-COT-001', quantity: 500, movement_type: 'IN', reason: 'Purchase from supplier', created_by: 3, created_by_name: 'Amit Patel', created_at: ago(10) },
  { id: 2, product_id: 3, product_name: 'Industrial Thread Spool', product_sku: 'THR-IND-003', quantity: 200, movement_type: 'OUT', reason: 'Sales Challan #CH-2026-0001', created_by: 2, created_by_name: 'Priya Sharma', created_at: ago(8) },
  { id: 3, product_id: 5, product_name: 'Brass Fittings Set', product_sku: 'HDW-BRS-005', quantity: 50, movement_type: 'IN', reason: 'Purchase from vendor', created_by: 3, created_by_name: 'Amit Patel', created_at: ago(5) },
  { id: 4, product_id: 7, product_name: 'Dye Pigment Red', product_sku: 'DYE-RED-007', quantity: 30, movement_type: 'OUT', reason: 'Sales Challan #CH-2026-0003', created_by: 2, created_by_name: 'Priya Sharma', created_at: ago(3) },
  { id: 5, product_id: 2, product_name: 'Silk Blend Yarn', product_sku: 'YRN-SLK-002', quantity: 100, movement_type: 'IN', reason: 'Bulk purchase order', created_by: 3, created_by_name: 'Amit Patel', created_at: ago(1) },
];

// ─── Challans ────────────────────────────────────────────────────────────────
export const challanItems: ChallanItem[] = [
  { id: 1, challan_id: 1, product_id: 3, product_name: 'Industrial Thread Spool', product_sku: 'THR-IND-003', unit_price: 120, quantity: 200 },
  { id: 2, challan_id: 1, product_id: 1, product_name: 'Premium Cotton Fabric', product_sku: 'FAB-COT-001', unit_price: 450, quantity: 50 },
  { id: 3, challan_id: 2, product_id: 5, product_name: 'Brass Fittings Set', product_sku: 'HDW-BRS-005', unit_price: 650, quantity: 30 },
  { id: 4, challan_id: 3, product_id: 7, product_name: 'Dye Pigment Red', product_sku: 'DYE-RED-007', unit_price: 780, quantity: 30 },
  { id: 5, challan_id: 3, product_id: 4, product_name: 'Polyester Resin', product_sku: 'CHM-PLY-004', unit_price: 1200, quantity: 10 },
  { id: 6, challan_id: 4, product_id: 6, product_name: 'Packaging Boxes (Large)', product_sku: 'PKG-BOX-006', unit_price: 45, quantity: 500 },
];

export const challans: Challan[] = [
  { id: 1, challan_number: 'CH-2026-0001', customer_id: 1, customer_name: 'Vikram Industries', customer_business: 'Vikram Industries Pvt Ltd', total_quantity: 250, total_amount: 46500, status: 'Confirmed', created_by: 2, created_by_name: 'Priya Sharma', created_at: ago(15), updated_at: ago(14), items: challanItems.filter(i => i.challan_id === 1) },
  { id: 2, challan_number: 'CH-2026-0002', customer_id: 4, customer_name: 'Lakshmi Enterprises', customer_business: 'Lakshmi Enterprises', total_quantity: 30, total_amount: 19500, status: 'Confirmed', created_by: 2, created_by_name: 'Priya Sharma', created_at: ago(12), updated_at: ago(11), items: challanItems.filter(i => i.challan_id === 2) },
  { id: 3, challan_number: 'CH-2026-0003', customer_id: 2, customer_name: 'Meera Textiles', customer_business: 'Meera Textiles & Co', total_quantity: 40, total_amount: 35400, status: 'Draft', created_by: 2, created_by_name: 'Priya Sharma', created_at: ago(5), updated_at: ago(4), items: challanItems.filter(i => i.challan_id === 3) },
  { id: 4, challan_number: 'CH-2026-0004', customer_id: 6, customer_name: 'Sunita Agencies', customer_business: 'Sunita Marketing Agencies', total_quantity: 500, total_amount: 22500, status: 'Draft', created_by: 2, created_by_name: 'Priya Sharma', created_at: ago(2), updated_at: ago(1), items: challanItems.filter(i => i.challan_id === 4) },
];

// ─── Followups ───────────────────────────────────────────────────────────────
export const customerFollowups: CustomerFollowup[] = [
  { id: 1, customer_id: 1, note: 'Discussed Q3 requirements. They need 500 units of cotton fabric.', created_by: 2, created_by_name: 'Priya Sharma', created_at: ago(20) },
  { id: 2, customer_id: 1, note: 'Order confirmed, challan CH-2026-0001 created.', created_by: 2, created_by_name: 'Priya Sharma', created_at: ago(15) },
  { id: 3, customer_id: 3, note: 'Initial call made. Interested in bulk yarn purchase. Send samples.', created_by: 2, created_by_name: 'Priya Sharma', created_at: ago(28) },
  { id: 4, customer_id: 6, note: 'Renewed distributor agreement for 2026-2027.', created_by: 1, created_by_name: 'Rajesh Kumar', created_at: ago(10) },
];

// ─── Auto-increment helpers ────────────────────────────────────────────────
export const nextId = {
  user: () => (users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1),
  customer: () => (customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1),
  product: () => (products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1),
  movement: () => (stockMovements.length > 0 ? Math.max(...stockMovements.map(m => m.id)) + 1 : 1),
  challan: () => (challans.length > 0 ? Math.max(...challans.map(c => c.id)) + 1 : 1),
  challanItem: () => (challanItems.length > 0 ? Math.max(...challanItems.map(i => i.id ?? 0)) + 1 : 1),
  followup: () => (customerFollowups.length > 0 ? Math.max(...customerFollowups.map(f => f.id)) + 1 : 1),
};
