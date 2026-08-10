# Stockly

Full-stack internal business application for wholesale/distribution operations. Built with React, Node.js, Express, TypeScript, and PostgreSQL.

---

## 1. Project Overview

**Stockly** is an internal business application for managing wholesale and distribution workflows across four core modules:
1. **Authentication and Roles**: Secure JWT authentication and Role-Based Access Control (Admin, Sales, Warehouse, Accounts). Automatic registration email alert to `emperoryagnesh@gmail.com`.
2. **Customer CRM**: Lead management, customer directory, follow-up notes history.
3. **Product and Inventory**: Catalog management, SKU tracking, warehouse location, min stock alerts, and `IN`/`OUT` stock movement audit log.
4. **Sales Challan**: Challan creation (Draft/Confirmed), atomic stock deduction using database transactions, stock insufficiency guards, and immutable product snapshots.

---

## 2. Tech Stack

- **Frontend**: React 19, TypeScript, Vite, React Router 7, Lucide Icons, Vanilla CSS
- **Backend**: Node.js, TypeScript, Express.js, JWT, bcryptjs, Zod, Nodemailer
- **Database**: PostgreSQL (with embedded PGlite engine for zero-setup local dev)

---

## 3. Key Business Logic & Features

- **Role-Based Access Control**: Strict access guards on API endpoints and UI navigation (Admin, Sales, Warehouse, Accounts).
- **Email Registration Notification**: Automatically triggers an email notification to `emperoryagnesh@gmail.com` via Nodemailer whenever a new user registration occurs.
- **CRM Follow-up System**: Track customer lead status (`Lead`, `Active`, `Inactive`), follow-up dates, and timestamped note entries.
- **Inventory Audit Log**: Track stock entries (`IN`) and dispatches (`OUT`) with recorded quantity changes, reasons, timestamp, and user tracking.
- **Atomic Challan Confirmation**: Executes a PostgreSQL transaction that locks product rows, checks stock availability, prevents negative stock, deducts stock atomically, and logs an `OUT` movement record.
- **Product Snapshot**: Stores static product pricing and SKU snapshots at challan creation to preserve historical records even if catalog prices change.

---

## 4. Architecture

Follows a clean Controller-Service architecture:
- **Controllers**: Express route controllers for parsing requests, input validation, and HTTP responses.
- **Services**: Pure business logic, PostgreSQL database transactions, stock deduction rules, and email dispatch.
- **Middleware**: JWT authentication token verification, role-based authorization guards, Zod schema validation, and error handler.
- **Config**: Database pool configuration with auto-fallback to embedded PGlite for rapid local testing.

---

## 5. Folder Structure

```
stockly/
├── backend/
│   ├── src/
│   │   ├── config/         # Database pool configuration & PGlite fallback
│   │   ├── controllers/    # Express controllers
│   │   ├── db/             # Schema SQL & seed script
│   │   ├── middleware/     # Auth JWT, RBAC guards, error handler, Zod validation
│   │   ├── models/         # TypeScript interfaces & types
│   │   ├── routes/         # REST API routes
│   │   ├── services/       # Core business services & email notification service
│   │   ├── utils/          # JWT, bcrypt password hashing, AppError helpers
│   │   ├── validators/     # Zod validation schemas
│   │   ├── app.ts          # Express application startup
│   │   └── server.ts       # Server entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios HTTP client & endpoint modules
│   │   ├── components/     # UI components (Header, Sidebar, Badges)
│   │   ├── context/        # Auth state context
│   │   ├── pages/          # Dashboard, Customer CRM, Inventory, Sales Challan pages
│   │   ├── styles/         # Global clean CSS system
│   │   ├── types/          # Shared TypeScript definitions
│   │   ├── App.tsx         # Routing configuration
│   │   └── main.tsx        # React mounting entry point
│   ├── .env.example
│   └── package.json
├── postman_collection.json # Complete API collection
└── README.md
```

---

## 6. Database Setup

Database schema includes 7 relational tables:
`users`, `customers`, `customer_followups`, `products`, `stock_movements`, `challans`, `challan_items`.

### Local PostgreSQL:
```bash
psql -U postgres -c "CREATE DATABASE stockly;"
psql -U postgres -d stockly -f backend/src/db/schema.sql
npm run db:seed --prefix backend
```

### Embedded Engine (PGlite - Default Fallback):
If local PostgreSQL is not running, the backend automatically initializes an embedded PGlite database, creates schema tables, and populates seed data on startup.

---

## 7. Environment Variables

Documented in `backend/.env.example`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/stockly
JWT_SECRET=super_secret_jwt_key_stockly_2026_dev
CLIENT_URL=http://localhost:5173

# Email Notification Settings
NOTIFICATION_EMAIL=emperoryagnesh@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Stockly Portal" <noreply@stockly.com>
```

---

## 8. Local Setup & Running Instructions

```bash
# 1. Install Backend Dependencies
cd backend
npm install

# 2. Install Frontend Dependencies
cd ../frontend
npm install

# 3. Run Backend (Terminal 1)
cd backend
npm run dev

# 4. Run Frontend (Terminal 2)
cd frontend
npm run dev
```

Open browser at `http://localhost:5173`.

---

## 9. Test Login Credentials

| Role | Email | Password | Access Scope |
|---|---|---|---|
| Admin | `admin@stockly.com` | `admin123` | Full access (CRM, Inventory, Sales Challans, Users) |
| Sales | `sales@stockly.com` | `sales123` | CRM, Sales Challans, Products |
| Warehouse | `warehouse@stockly.com` | `warehouse123` | Products, Stock Movements, Sales Challans |
| Accounts | `accounts@stockly.com` | `accounts123` | Read-only view of Customers, Products, Challans |

---

## 10. API Endpoints

Base API URL: `http://localhost:5000/api`

### Auth & User Routes
- `POST /api/auth/login` - Authenticate user & get JWT token
- `POST /api/auth/register` - Create user & send email notification to `emperoryagnesh@gmail.com`
- `GET /api/auth/me` - Get active logged-in profile
- `GET /api/auth/users` - Admin: List system users

### Customer CRM Routes
- `GET /api/customers` - List customer directory (`?search=`, `?status=`, `?type=`)
- `GET /api/customers/:id` - Customer detail view
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer details
- `POST /api/customers/:id/followups` - Log CRM follow-up note
- `GET /api/customers/:id/followups` - Get follow-up note history

### Product and Inventory Routes
- `GET /api/products` - List products (`?search=`, `?category=`, `?lowStock=true`)
- `GET /api/products/:id` - Product details
- `POST /api/products` - Add new product
- `PUT /api/products/:id` - Update product
- `POST /api/products/:id/stock-movement` - Record manual IN/OUT stock movement
- `GET /api/products/:id/stock-movements` - View product stock audit history
- `GET /api/stock-movements` - Global stock movement audit log

### Sales Challan Routes
- `GET /api/challans` - List sales challans (`?search=`, `?status=`)
- `GET /api/challans/:id` - Get sales challan detail & line items
- `POST /api/challans` - Create Draft challan (or confirm immediately)
- `POST /api/challans/:id/confirm` - Confirm challan & deduct stock in DB transaction
- `POST /api/challans/:id/cancel` - Cancel Draft challan

### Dashboard Routes
- `GET /api/dashboard/stats` - Fetch summary cards & recent activity

---

## 11. Git & Deployment Instructions

### Commit & Push to GitHub:
```bash
git add .
git commit -m "feat: complete Stockly portal with email notification on new registration"
git push origin main
```

---

## 12. Assumptions & Known Constraints

- Stock reduction occurs strictly on challan confirmation (not on Draft).
- Product details are captured as static snapshots on challan creation to preserve historical accuracy.
- Email notifications fallback to clean console logs when SMTP credentials are not configured in `.env`.
