-- Stockly Relational Database Schema (PostgreSQL)

DROP TABLE IF EXISTS challan_items CASCADE;
DROP TABLE IF EXISTS challans CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customer_followups CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(150) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Sales', 'Warehouse', 'Accounts')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers Table
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  business_name VARCHAR(200) NOT NULL,
  gst_number VARCHAR(50),
  type VARCHAR(50) NOT NULL CHECK (type IN ('Retail', 'Wholesale', 'Distributor')),
  address TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Lead', 'Active', 'Inactive')),
  followup_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Customer Follow-ups Table
CREATE TABLE customer_followups (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Products Table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  min_stock_alert INTEGER NOT NULL DEFAULT 5 CHECK (min_stock_alert >= 0),
  location VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Stock Movements Log Table
CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
  reason VARCHAR(255) NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Sales Challans Table
CREATE TABLE challans (
  id SERIAL PRIMARY KEY,
  challan_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  total_quantity INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Draft', 'Confirmed', 'Cancelled')),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Sales Challan Items (Product Snapshot Table)
CREATE TABLE challan_items (
  id SERIAL PRIMARY KEY,
  challan_id INTEGER NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name VARCHAR(200) NOT NULL,
  product_sku VARCHAR(100) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- Indexes for Query Performance
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_challans_number ON challans(challan_number);
CREATE INDEX idx_challans_customer ON challans(customer_id);
