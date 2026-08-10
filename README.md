# Mini ERP + CRM Operations Portal

Full-stack internal operations portal for a wholesale/distribution business. Built with React, Node.js, Express, TypeScript, and PostgreSQL.

---

## 1. Project Overview

An internal operations tool for managing wholesale and distribution workflows across four key roles: **Admin**, **Sales**, **Warehouse**, and **Accounts**.

Key modules:
- **Customer CRM**: Lead management, customer directory, follow-up history
- **Products & Inventory**: SKU catalog, stock levels, location tracking, low stock alerts
- **Stock Movements**: IN/OUT audit log with movement reasons and user tracking
- **Sales Challans**: Sales dispatch workflow with stock validation and atomic database transactions

---

## 2. Tech Stack

- **Frontend**: React 19, TypeScript, Vite, React Router 7, Axios, Vanilla CSS
- **Backend**: Node.js, TypeScript, Express.js, JWT, bcryptjs, Zod
- **Database**: PostgreSQL (with embedded PGlite fallback for local dev)

---

## 3. Features

- **Role-Based Access Control**: Enforced on API routes and UI navigation (Admin, Sales, Warehouse, Accounts)
- **CRM Follow-up System**: Track customer status, follow-up dates, and notes timeline
- **Inventory Audit Log**: Record stock entries/dispatches with reason logging
- **Atomic Challan Confirmation**: Locks product rows in a DB transaction, validates stock availability, deducts stock, and creates movement records
- **Product Snapshot**: Challans store product name, SKU, and unit price at creation time

---

## 4. Architecture

Follows standard Controller-Service pattern:
- **Controllers**: Handle HTTP request parsing, response formatting, and error forwarding
- **Services**: Implement business logic, database queries, and transaction management
- **Middleware**: JWT authentication, role guards, Zod validation, error handling
- **Config**: Database pool initialization with auto-fallback to embedded PGlite

---

## 5. Folder Structure

```
full stack/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration & initialization
│   │   ├── controllers/    # Route controllers
│   │   ├── db/             # PostgreSQL schema & seed script
│   │   ├── middleware/     # Auth, RBAC, error handling, validation
│   │   ├── models/         # TypeScript interfaces
│   │   ├── routes/         # Express API routes
│   │   ├── services/       # Database & business logic
│   │   ├── utils/          # JWT, password hashing, error helpers
│   │   ├── validators/     # Zod validation schemas
│   │   ├── app.ts          # Express app configuration
│   │   └── server.ts       # HTTP server entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # API client & request wrappers
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Authentication state context
│   │   ├── pages/          # Application views
│   │   ├── styles/         # Global styles
│   │   ├── types/          # Shared TypeScript interfaces
│   │   ├── App.tsx         # Route configuration & layout
│   │   └── main.tsx        # Application entry point
│   ├── .env.example
│   └── package.json
├── postman_collection.json
└── README.md
```

---

## 6. Database Setup

Database schema uses `CREATE TABLE IF NOT EXISTS` across 7 tables:
`users`, `customers`, `customer_followups`, `products`, `stock_movements`, `challans`, `challan_items`.

### Schema execution (Local PostgreSQL):
```bash
psql -U postgres -c "CREATE DATABASE minierp_crm;"
psql -U postgres -d minierp_crm -f backend/src/db/schema.sql
npm run db:seed --prefix backend
```

### Embedded PGlite engine (Fallback):
If no local PostgreSQL instance is running, the server automatically initializes PGlite, creates tables, and auto-seeds initial data on first run.

---

## 7. Environment Variables

Documented in `backend/.env.example` and `frontend/.env.example`:

### `backend/.env`
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/minierp_crm
JWT_SECRET=super_secret_jwt_key_minierp_crm_2026_dev
CLIENT_URL=http://localhost:5173
```

---

## 8. Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## 9. Running Locally

Start backend and frontend in separate terminals:

```bash
# Terminal 1 - Backend (port 5000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend
npm run dev
```

Open browser at `http://localhost:5173`.

---

## 10. Test Credentials

| Role | Email | Password | Allowed Access |
|---|---|---|---|
| Admin | admin@example.com | `password123` | Full system access |
| Sales | sales@example.com | `password123` | Customers, CRM, Challans, Products |
| Warehouse | warehouse@example.com | `password123` | Products, Stock Movements, Challan view/confirm |
| Accounts | accounts@example.com | `password123` | Read-only view of Customers, Products, Challans |

---

## 11. API Documentation

Base URL: `http://localhost:5000/api`

### Auth
- `POST /api/auth/login` - Authenticate & obtain JWT
- `GET /api/auth/me` - Get logged-in user profile
- `GET /api/auth/users` - Admin: List system users

### Customers CRM
- `GET /api/customers` - List customers (`?search=`, `?status=`, `?type=`, `?page=`)
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Admin: Delete customer
- `POST /api/customers/:id/followups` - Log CRM follow-up note
- `GET /api/customers/:id/followups` - View customer follow-up history

### Products & Inventory
- `GET /api/products` - List products (`?search=`, `?category=`, `?lowStock=true`)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `POST /api/products/:id/stock-movement` - Record manual IN/OUT stock movement
- `GET /api/products/:id/stock-movements` - View product movement history
- `GET /api/stock-movements` - Global stock audit log

### Sales Challans
- `GET /api/challans` - List sales challans (`?search=`, `?status=`, `?page=`)
- `GET /api/challans/:id` - Get challan details & line items
- `POST /api/challans` - Create Draft challan (or confirm immediately)
- `POST /api/challans/:id/confirm` - Confirm challan & deduct stock in DB transaction
- `POST /api/challans/:id/cancel` - Cancel Draft challan

### Dashboard
- `GET /api/dashboard/stats` - Summary metrics (totals, low stock alerts, recent activity)

---

## 12. Deployment

1. **Database**: Provision PostgreSQL database (Supabase, Neon, Render Postgres). Run `schema.sql`.
2. **Backend**: Deploy to Node.js host (Render, Railway, Fly.io). Set environment variables (`DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`).
3. **Frontend**: Build dist assets with `npm run build`. Deploy to static host (Vercel, Netlify).

---

## 13. Assumptions

- Customer GST number is optional
- Confirmed challans cannot be cancelled or modified
- Stock deduction occurs strictly upon challan confirmation
- Product details on created challans are locked snapshot records

---

## 14. Known Limitations

- PDF download/export is not included in current scope
- Automated email notifications are not configured
- User management is read-only in UI (users created via database/seed)
