# Personal Finance Tracker - Backend API

A production-grade, secure RESTful API built with **Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL** to record, organise, and analyse personal income, expenses, categories, and monthly budgets.

---

## 🛠 Tech Stack

- **Runtime & Language**: Node.js & TypeScript
- **Web Framework**: Express 5
- **ORM & Database**: Prisma ORM with PostgreSQL
- **Security & Auth**: JWT (`jsonwebtoken`) & password hashing with `bcryptjs`
- **Validation**: Zod schema validation
- **Testing**: Automated end-to-end integration test suite

---

## 🏗 Architecture & Database Model

Four core normalized relational tables:

```
[User] 1 ---- * [Category]
  |  1             | 1
  |  |             | |
  |  *             | *
[Transaction] * -- 1 [Category]
  |
[Budget] * ------- 1 [Category]
```

- **User**: `id`, `name`, `email` (unique), `passwordHash`, `createdAt`
- **Category**: `id`, `userId`, `name`, `color` (`@@unique([userId, name])`)
- **Transaction**: `id`, `userId`, `categoryId`, `type` (`INCOME` | `EXPENSE`), `amount`, `date`, `note`
- **Budget**: `id`, `userId`, `categoryId`, `month` (`YYYY-MM`), `limitAmount` (`@@unique([userId, categoryId, month])`)

---

## 🔐 Security Features

1. **Password Hashing**: Passwords are never stored in plain text; hashed using bcrypt with salt rounds of 10.
2. **Stateless JWT Tokens**: Signed expiration tokens (`7d`) with bearer token authentication.
3. **Multi-Tenant Data Isolation**: Every query is scoped to the authenticated `userId`. User A cannot view, mutate, or reference User B's records or categories.
4. **Input Validation**: All payloads, query params, date strings, and positive numerical amounts are validated with Zod before processing.
5. **CSV Formula Injection Prevention**: Export sanitizes cells starting with `=`, `+`, `-`, `@` to prevent spreadsheet formula execution.
6. **Referential Integrity**: Categories with attached transactions cannot be accidentally deleted (`onDelete: Restrict`).

---

## 📡 REST API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new account & auto-seed default categories | Public |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | Public |
| `GET` | `/api/auth/me` | Get currently logged-in user profile | Bearer Token |
| `PATCH` | `/api/auth/profile` | Update profile name or email | Bearer Token |
| `PATCH` | `/api/auth/change-password` | Change password with current password verification | Bearer Token |

### Categories (`/api/categories`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/categories` | List user's categories | Bearer Token |
| `GET` | `/api/categories/:id` | Get single category | Bearer Token |
| `POST` | `/api/categories` | Create new category (`name`, `color`) | Bearer Token |
| `PATCH` | `/api/categories/:id` | Update category | Bearer Token |
| `DELETE` | `/api/categories/:id` | Delete category (blocked if transactions exist) | Bearer Token |

### Transactions (`/api/transactions`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/transactions` | List transactions with filters (`month`, `type`, `categoryId`, `search`, `from`, `to`, `sortBy`, `sortOrder`) | Bearer Token |
| `GET` | `/api/transactions/export` | Download filtered transactions as CSV file | Bearer Token |
| `GET` | `/api/transactions/:id` | Get single transaction | Bearer Token |
| `POST` | `/api/transactions` | Create transaction (`categoryId`, `type`, `amount`, `date`, `note`) | Bearer Token |
| `PATCH` | `/api/transactions/:id` | Update transaction | Bearer Token |
| `DELETE` | `/api/transactions/:id` | Delete transaction | Bearer Token |

### Budgets (`/api/budgets`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/budgets?month=YYYY-MM` | List monthly budgets with `spent`, `remaining`, and `% spent` | Bearer Token |
| `GET` | `/api/budgets/:id` | Get single budget with progress metadata | Bearer Token |
| `POST` | `/api/budgets` | Set / update monthly budget limit for a category | Bearer Token |
| `DELETE` | `/api/budgets/:id` | Delete a budget | Bearer Token |

### Dashboard & Analytics (`/api/summary`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/summary?month=YYYY-MM` | Overview: income, expense, balance, savings rate, category breakdown, MoM change, 6-month historical trend & recent transactions | Bearer Token |

### System Health
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/health` | Service uptime and status check | Public |

---

## 🚀 Getting Started

### 1. Environment Setup
Create a `.env` file in `backend/`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/finance_tracker?schema=public"
PORT=5000
JWT_SECRET="your_secure_jwt_secret_key"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000,http://localhost:5173,http://localhost:5174"
```

### 2. Database Migrations
```bash
npx prisma migrate dev
```

### 3. Seed Demo Data (for project presentation)
```bash
npm run seed
```
**Demo Account Credentials:**
- **Email:** `demo@example.com`
- **Password:** `Password123!`

### 4. Run the Server
```bash
npm run dev
```

### 5. Run Verification Test Suite
```bash
npm test
```

### 6. Production Build
```bash
npm run build
npm start
```
