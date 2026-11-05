# Personal Finance Tracker

A secure full-stack web application to record, organise and understand personal income and expenses.

---

## 📌 Project Overview
Managing money is difficult when transactions are scattered across bank apps, notes and memory. **Personal Finance Tracker** is a 3-tier full-stack application that provides a unified dashboard to track transactions, organise categories, set monthly budgets with progress tracking, and visualize financial trends.

- **Frontend**: React 19 + TypeScript, Tailwind CSS v4, Redux Toolkit, Recharts (in `frontend/`)
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (in `backend/`)
- **Security**: JWT authentication, bcrypt password hashing, input validation (Zod), multi-tenant data isolation

---

## 🗂 Project Structure

```
personal-finance-tracker/
├── backend/                  # Node.js + Express + Prisma REST API
│   ├── prisma/
│   │   ├── schema.prisma     # 4 Core Tables: User, Category, Transaction, Budget
│   │   └── seed.ts           # Demo seed script for live presentations
│   ├── src/
│   │   ├── config.ts         # Environment and app configuration
│   │   ├── index.ts          # Express app entry & middleware
│   │   ├── prisma.ts         # Prisma client instance
│   │   ├── middleware/
│   │   │   └── auth.ts       # JWT Bearer token authentication
│   │   ├── routes/
│   │   │   ├── auth.ts       # Register, Login, Me, Profile, Password
│   │   │   ├── categories.ts # Category CRUD & validation
│   │   │   ├── transactions.ts# Transaction CRUD, filters & CSV export
│   │   │   ├── budgets.ts    # Monthly budget tracking & remaining calculations
│   │   │   └── summary.ts    # Dashboard analytics, MoM comparison & trends
│   │   ├── test-suite.ts     # Automated verification test suite (36 tests)
│   │   └── e2e-check.ts      # Full-stack E2E integration test
│   ├── .env                  # Database URL & environment secrets
│   └── package.json
└── frontend/                 # React 19 + Vite client application
    ├── src/
    │   ├── api/              # Axios client & typed API services
    │   ├── components/       # Layout, Modals, StatCards, MonthPicker
    │   ├── pages/            # Login, Register, Dashboard, Transactions, Budgets, Reports, Settings
    │   ├── store/            # Redux Toolkit store & slices (auth, finance)
    │   └── types/            # TypeScript interfaces
    ├── .env                  # Vite API URL
    └── package.json
```

---

## ⚡ Quick Start

### 1. Backend Setup & Run
```bash
cd backend
npm install
npx prisma migrate dev
npm run seed       # Seeds demo presentation account
npm test           # Runs 36 automated unit & integration tests
npm run dev        # Starts backend API on http://localhost:5000
```

### 2. Frontend Setup & Run
Open a second terminal window:
```bash
cd frontend
npm install
npm run dev        # Starts React frontend on http://localhost:5173
```

---

## 🎭 Live Demo Walkthrough (Slide 15)

1. Open `http://localhost:5173` in your browser.
2. Click **"Fill Demo Presentation Account"** on the login page (or enter `demo@example.com` / `Password123!`).
3. **Dashboard**: View monthly balance, income, expenses, savings rate, 6-month cash flow chart, category donut breakdown, and recent transactions.
4. **Transactions**: Click "Add Transaction" to record income or expense. Test filtering by month, type, category, or note search. Click "Export CSV".
5. **Budgets**: Inspect monthly category limits, dynamic progress bars (emerald < 75%, amber 75-100%, rose > 100%), and remaining balances.
6. **Reports**: View detailed analytics, savings trajectory line charts, and average daily spend metrics.
7. **Settings**: Edit profile name, change password, or create/manage custom categories with color tags.
