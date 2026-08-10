# Mini ERP + CRM Operations Portal

A full-stack internal operations portal for a wholesale/distribution company, built as a technical case study. Covers customer CRM, product inventory, stock movements, and sales challan workflow with role-based access control.

---

## Project Overview

An internal ERP/CRM portal used by four operational roles — **Admin**, **Sales**, **Warehouse**, and **Accounts** — to manage:

- **Customer CRM**: customer directory, lead tracking, follow-up timeline
- **Products & Inventory**: SKU catalog, stock levels, low-stock alerts, warehouse rack locations
- **Stock Movements**: full audit log of every IN/OUT movement with reasons
- **Sales Challans**: draft-to-confirm workflow with atomic PostgreSQL transactions — stock is only reduced upon confirmation, never goes negative, and historical product snapshots are preserved

---

## Technology Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 19, TypeScript, Vite, React Router 7, Axios |
| Backend    | Node.js, TypeScript, Express.js                 |
| Database   | PostgreSQL (via `pg`) with embedded PGlite fallback |
| Auth       | JWT (`jsonwebtoken`), bcrypt password hashing   |
| Validation | Zod (backend), HTML5 constraints (frontend)     |
| Styling    | Vanilla CSS — clean internal admin system style |

---

## Architecture

```
full stack/
├── backend/
│   ├── src/
│   │   ├── config/         # DB pool / PGlite init, env loading
│   │   ├── controllers/    # Express route handlers
│   │   ├── db/             # schema.sql, seed.ts
│   │   ├── middleware/     # authMiddleware, roleMiddleware, validate, errorHandler
│   │   ├── models/         # TypeScript interfaces (User, Customer, Product, etc.)
│   │   ├── routes/         # Express routers per module
│   │   ├── services/       # Business logic & SQL queries
│   │   ├── utils/          # JWT helpers, bcrypt, AppError class
│   │   ├── validators/     # Zod validation schemas
│   │   ├── app.ts          # Express setup, CORS, route mounting
│   │   └── server.ts       # DB init + auto-seed + HTTP listen
│   ├── .env
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios client + typed API wrappers per module
│   │   ├── components/     # Sidebar, TopHeader, StatusBadge, Pagination
│   │   ├── context/        # AuthContext (JWT session, role state)
│   │   ├── pages/          # Login, Dashboard, Customers, CustomerDetail,
│   │   │                   # Products, Inventory, Challans, CreateChallan,
│   │   │                   # ChallanDetail, Users
│   │   ├── styles/         # index.css — clean professional admin CSS
│   │   ├── types/          # Shared TypeScript types
│   │   ├── App.tsx         # React Router with protected layout + role guards
│   │   └── main.tsx        # Entry point
│   ├── .env.example
│   └── package.json
├── postman_collection.json
└── README.md
```

---

## Database Schema

Seven tables with proper PKs, FKs, indexes, and constraints:

| Table                | Purpose                                            |
|----------------------|----------------------------------------------------|
| `users`              | Portal user accounts with roles                    |
| `customers`          | Customer CRM directory                             |
| `customer_followups` | CRM follow-up log per customer                     |
| `products`           | Product catalog with stock and min-alert levels    |
| `stock_movements`    | Audit log of every IN/OUT stock event              |
| `challans`           | Sales challan headers (Draft/Confirmed/Cancelled)  |
| `challan_items`      | Line items with **product snapshot** at sale time  |

All schema migrations use `CREATE TABLE IF NOT EXISTS` — safe to rerun.

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/minierp_crm
JWT_SECRET=super_secret_jwt_key_minierp_crm_2026_dev
CLIENT_URL=http://localhost:5173
```

### Frontend

The frontend uses Vite's dev proxy — no separate `.env` needed for local development. All API calls go through `/api` which Vite proxies to `http://localhost:5000`.

---

## Local Installation

### Prerequisites

- **Node.js** v18+ (tested on v24)
- **PostgreSQL** 14+ (optional — the app falls back to an embedded PGlite engine if no Postgres server is available)

### 1. Clone and install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env if you have a local PostgreSQL server to connect to
```

### 3. Database Setup

**Option A — with local PostgreSQL:**
```bash
# Create the database
psql -U postgres -c "CREATE DATABASE minierp_crm;"

# Run migrations
psql -U postgres -d minierp_crm -f src/db/schema.sql

# Seed demo data
npm run db:seed
```

**Option B — without PostgreSQL (uses embedded engine):**

No setup needed. The server auto-detects that no PostgreSQL is running, initializes the embedded PGlite engine, runs the schema, and seeds demo data automatically on first startup.

---

## How to Run

### Backend

```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### Frontend

```bash
cd frontend
npm run dev
# App starts on http://localhost:5173
```

Both servers must be running simultaneously. The Vite dev server proxies all `/api` requests to the backend automatically.

---

## Test Login Credentials

All accounts use the same password for demo purposes.

| Role      | Email                    | Password      | Access Level                         |
|-----------|--------------------------|---------------|--------------------------------------|
| Admin     | admin@example.com        | `password123` | Full access to all modules           |
| Sales     | sales@example.com        | `password123` | Customers, CRM, Challans, Products   |
| Warehouse | warehouse@example.com    | `password123` | Products, Stock Movements, Challans  |
| Accounts  | accounts@example.com     | `password123` | Customers, Challans (read), Products |

---

## Role-Based Access (RBAC)

Authorization is enforced on both the **API** (middleware) and the **frontend** (route guards, hidden buttons). Backend enforcement is the source of truth — frontend restrictions are UI convenience only.

| Action                     | Admin | Sales | Warehouse | Accounts |
|----------------------------|-------|-------|-----------|----------|
| View Customers             | ✅    | ✅    | ❌        | ✅       |
| Create/Edit Customers      | ✅    | ✅    | ❌        | ❌       |
| Delete Customers           | ✅    | ❌    | ❌        | ❌       |
| Add CRM Follow-up          | ✅    | ✅    | ❌        | ❌       |
| View Products              | ✅    | ✅    | ✅        | ✅       |
| Create/Edit Products       | ✅    | ❌    | ✅        | ❌       |
| Record Stock Movement      | ✅    | ❌    | ✅        | ❌       |
| Create Challan             | ✅    | ✅    | ❌        | ❌       |
| Confirm Challan            | ✅    | ✅    | ✅        | ❌       |
| Cancel Challan             | ✅    | ✅    | ❌        | ❌       |
| User Management            | ✅    | ❌    | ❌        | ❌       |

---

## API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint         | Body / Notes              |
|--------|------------------|---------------------------|
| POST   | `/auth/login`    | `{ email, password }`     |
| GET    | `/auth/me`       | Returns current user info |
| GET    | `/auth/users`    | Admin only — all users    |

### Customers

| Method | Endpoint                           | Notes                          |
|--------|------------------------------------|--------------------------------|
| GET    | `/customers`                       | `?search=&status=&type=&page=` |
| GET    | `/customers/:id`                   | Single customer profile        |
| POST   | `/customers`                       | Create customer                |
| PUT    | `/customers/:id`                   | Update customer                |
| DELETE | `/customers/:id`                   | Admin only                     |
| POST   | `/customers/:id/followups`         | Add CRM follow-up note         |
| GET    | `/customers/:id/followups`         | CRM follow-up timeline         |

### Products

| Method | Endpoint                                 | Notes                          |
|--------|------------------------------------------|--------------------------------|
| GET    | `/products`                              | `?search=&category=&lowStock=` |
| GET    | `/products/:id`                          | Single product                 |
| POST   | `/products`                              | Create product                 |
| PUT    | `/products/:id`                          | Update product                 |
| POST   | `/products/:id/stock-movement`           | Manual IN or OUT adjustment    |
| GET    | `/products/:id/stock-movements`          | Product stock history          |

### Stock Movements (Global)

| Method | Endpoint             | Notes                                      |
|--------|----------------------|--------------------------------------------|
| GET    | `/stock-movements`   | `?product_id=&movement_type=&page=`        |

### Sales Challans

| Method | Endpoint                     | Notes                                         |
|--------|------------------------------|-----------------------------------------------|
| GET    | `/challans`                  | `?search=&status=&customer_id=&page=`         |
| GET    | `/challans/:id`              | Full challan with items                       |
| POST   | `/challans`                  | Create Draft (or confirm immediately)         |
| POST   | `/challans/:id/confirm`      | Confirm + deduct stock in DB transaction      |
| POST   | `/challans/:id/cancel`       | Cancel (only Draft challans)                  |

### Dashboard

| Method | Endpoint              | Notes                               |
|--------|-----------------------|-------------------------------------|
| GET    | `/dashboard/stats`    | Real metrics from DB                |

### HTTP Status Codes Used

| Code | Meaning                                     |
|------|---------------------------------------------|
| 200  | Success (GET, PUT, POST confirm/cancel)     |
| 201  | Created (POST create)                       |
| 400  | Bad Request (insufficient stock, already confirmed, wrong state) |
| 401  | Unauthorized (missing/invalid token)        |
| 403  | Forbidden (wrong role)                      |
| 404  | Not Found                                   |
| 409  | Conflict (duplicate email, duplicate SKU)   |
| 422  | Validation Error (Zod schema failure)       |
| 500  | Server Error                                |

---

## Sales Challan Business Logic

The challan confirmation is the most critical operation. It executes inside a **PostgreSQL transaction**:

1. Lock the challan row (`SELECT ... FOR UPDATE`)
2. If already `Confirmed` → return 400 (prevents double deduction)
3. If `Cancelled` → return 400
4. For each challan item, lock the product row (`SELECT ... FOR UPDATE`)
5. If `item.quantity > product.current_stock` → return 400 with exact error: *"Insufficient stock for SKU {sku}. Available: {n}, Requested: {m}."*
6. Deduct stock from all products
7. Insert `OUT` stock movement records for each item
8. Set challan status to `Confirmed` with `confirmed_at = NOW()`
9. If any step fails → `ROLLBACK` — no partial updates

Challan items store a **snapshot** of product name, SKU, and unit price at the time of challan creation. Editing the product catalog later does not affect historical challans.

---

## Postman Collection

Import `postman_collection.json` into Postman. The collection covers:

- Admin login
- Customer CRUD
- CRM follow-up logging
- Product creation
- Manual stock adjustment
- Draft challan creation
- Challan confirmation
- Insufficient stock error case (returns 400)

Set `authToken` collection variable after a successful login.

---

## Deployment

### Frontend → Vercel / Netlify

```bash
cd frontend
npm run build
# Deploy the `dist/` folder
```

Set environment variable `VITE_API_BASE_URL=https://your-backend.onrender.com/api`

Update `vite.config.ts` to use `VITE_API_BASE_URL` for production (currently uses Vite proxy for local dev).

### Backend → Render / Railway / Fly.io

Set these environment variables in your deployment platform:

```
PORT=10000
NODE_ENV=production
DATABASE_URL=postgres://...your-production-db-url...
JWT_SECRET=your-strong-random-secret
CLIENT_URL=https://your-frontend-url.vercel.app
```

### Database → Neon / Supabase / Render PostgreSQL

1. Create a PostgreSQL database
2. Run `backend/src/db/schema.sql` to create tables
3. Run `npm run db:seed` with `DATABASE_URL` pointing to the production database

---

## Assumptions

- GST number is optional for customers (not all customers are GST-registered)
- Only Draft challans can be confirmed or cancelled; Confirmed challans are immutable
- Stock movements from challan confirmations are automatically created — only manual adjustments need the warehouse user to input a reason
- No soft-delete; customer deletion is a hard delete (Admin only)
- The embedded PGlite engine stores data in `backend/.pgdata/` — this persists across server restarts on the same machine

---

## Known Limitations

- No PDF challan export (planned as future enhancement)
- No email notification system for follow-up reminders
- No user creation/editing in the UI (users are seeded — extend via database or API)
- PGlite is single-process only; for production, use a real PostgreSQL server
- No file attachment support for customer follow-ups
