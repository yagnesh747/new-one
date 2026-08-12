# Stockly — Mini ERP + CRM Operations Portal

A full-stack ERP/CRM portal for wholesale/distribution operations built with Node.js, Express, TypeScript, PostgreSQL, and React.

---

## What is included

Stockly supports core operations for internal teams:

- Authentication with role-based access for Admin, Sales, Warehouse, and Accounts
- Customer CRM with follow-up notes
- Product and inventory management
- Stock movement logging (IN/OUT)
- Sales challan workflow with Draft / Confirm / Cancel
- Stock validation on challan confirmation, preventing negative inventory
- Challenge number generation and product snapshoting in challan items
- Dashboard with counts, low-stock alerts, recent activity, and sales trends

---

## Technology stack

- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL
- Validation: Zod
- Auth: JWT
- Frontend: React, TypeScript, Vite
- HTTP: Axios
- Styling: Vanilla CSS

---

## Project structure

```
full stack/
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/db.ts
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── middleware/
│   │   ├── db/schema.sql
│   │   ├── db/seed.ts
│   │   └── types/index.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── context/AuthContext.tsx
│   │   ├── pages/
│   │   ├── services/
│   │   ├── components/
│   │   └── types/index.ts
│   ├── package.json
│   └── tsconfig.json
├── Postman/Stockly.postman_collection.json
└── README.md
```

---

## Local setup

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL 14+

### Backend setup

1. Open terminal and navigate to `backend`

```bash
cd "c:\Users\YAGNESH\OneDrive\Desktop\full stack\backend"
npm install
```

2. Copy environment variables

```bash
copy .env.example .env
```

3. Edit `backend/.env` with your local database connection string and JWT secret

Example:

```env
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/stockly
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:5173
```

4. Create the database in PostgreSQL if not already created

```sql
CREATE DATABASE stockly;
```

5. Seed the database

```bash
npm run seed
```

6. Start the backend server

```bash
npm run dev
```

Server should be available at `http://localhost:5000`

### Frontend setup

1. Open terminal and navigate to `frontend`

```bash
cd "c:\Users\YAGNESH\OneDrive\Desktop\full stack\frontend"
npm install
```

2. Copy environment variables

```bash
copy .env.example .env
```

3. Start frontend

```bash
npm run dev
```

Frontend should be available at `http://localhost:5173`

---

## Environment variables

### Backend

- `PORT` — backend port
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing secret
- `CLIENT_URL` — allowed frontend origin

### Frontend

- `VITE_API_URL` — API base URL (default `http://localhost:5000/api`)

---

## Authentication

The backend uses JWT authentication.

### Login endpoint

- `POST /api/auth/login`
  - body: `{ email, password }`

### Current user endpoint

- `GET /api/auth/me`
  - requires `Authorization: Bearer <token>`

---

## Test accounts

All sample accounts use password: `password123`

| Role      | Email                 |
|-----------|-----------------------|
| Admin     | admin@example.com     |
| Sales     | sales@example.com     |
| Warehouse | warehouse@example.com |
| Accounts  | accounts@example.com  |

---

## Core API endpoints

### Customers

- `GET /api/customers`
- `POST /api/customers`
- `GET /api/customers/:id`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`
- `GET /api/customers/:id/followups`
- `POST /api/customers/:id/followups`

### Products

- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `PUT /api/products/:id`
- `GET /api/products/stock-movements`
- `POST /api/products/stock-movements`

### Sales Challans

- `GET /api/challans`
- `POST /api/challans`
- `GET /api/challans/:id`
- `PUT /api/challans/:id`
- `PATCH /api/challans/:id/confirm`
- `PATCH /api/challans/:id/cancel`

### Dashboard

- `GET /api/dashboard/summary`
- `GET /api/dashboard/stats`
- `GET /api/dashboard/low-stock`
- `GET /api/dashboard/recent-activity`
- `GET /api/dashboard/sales-summary`
- `GET /api/dashboard/top-customers`

---

## Business flows supported

- Customer management with search, filtering, and follow-up notes
- Product inventory management and manual stock movement tracking
- Sales challan creation with line items and customer selection
- Draft challan save and final confirmation logic
- Confirmed challans reduce stock and create stock movement records
- Cancellation is blocked for confirmed challans
- Product snapshot data saved in challan lines for historical integrity
- Dashboard summaries and low stock alerts

---

## Known limitations

- No invoice module implemented yet
- No purchase order module implemented yet
- File/image upload is not included
- Live deployment URL is not configured in this repository

---

## Notes

- The project is built for a working local setup.
- The `Postman/Stockly.postman_collection.json` file contains API requests for testing.
- The project uses environment variables for backend connection and frontend API URL.
- The backend supports a PostgreSQL database with schema + seed automation.

---

## How the server is set up

- `backend/src/app.ts` configures Express, middleware, CORS, and routes.
- `backend/src/server.ts` connects to PostgreSQL and starts the server.
- `backend/src/config/db.ts` manages the PostgreSQL pool.
- `backend/src/middleware` contains auth, role, and error handling.
- `backend/src/services` contains business logic and transaction handling.
- `backend/src/db/schema.sql` defines the database schema.
- `backend/src/db/seed.ts` creates sample users, customers, products, stock movements, and challans.

---

## Deployment

This repository is ready for deployment to any static frontend host and Node backend host.

For local work, run frontend with Vite and backend with `npm run dev`.

If deploying externally, set environment variables in the host platform and ensure the backend has access to a PostgreSQL database.
