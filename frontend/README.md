# Personal Finance Tracker - Frontend

A responsive, modern web application built with **React, TypeScript, Tailwind CSS, Redux Toolkit, and Recharts** to record, organise, and analyse personal income and expenses.

---

## 🛠 Tech Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **State Management**: Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Data Visualization**: Recharts (interactive 6-month Bar/Line cash flow charts and Donut expense breakdown charts)
- **HTTP Client**: Axios with JWT Bearer token request interceptors and automatic 401 session expiry handling

---

## 📱 Application Screens & Features

1. **Authentication (`/login`, `/register`)**:
   - Clean card layout with error alerts.
   - Quick "Fill Demo Presentation Account" button for live demo walkthroughs.
   - Password confirmation & validation.
   - Auto-seeding of 7 standard categories upon registration.
2. **Dashboard (`/dashboard`)**:
   - Monthly selector (`< Month YYYY >`).
   - 4 Key Stat Cards: Total Balance, Monthly Income, Monthly Expenses, Savings Rate % with month-over-month indicators.
   - Interactive 6-Month Income vs Expenses Bar Chart.
   - Expense Category Breakdown Donut Chart with percentage share.
   - Monthly Budget Progress Bars (real-time spent vs. limit).
   - Recent Transactions quick-view.
3. **Transactions (`/transactions`)**:
   - Comprehensive CRUD: Add, View, Edit, and Delete transactions.
   - Rich Filter & Search Toolbar: Filter by Month, Type (Income / Expense), Category, Search inside Notes, Sort by Date or Amount.
   - One-Click CSV Export for spreadsheet analysis.
   - Income/Expense badges with category color tags.
4. **Budgets (`/budgets`)**:
   - Monthly category limit tracking.
   - Overall Utilization overview banner with total budgeted, spent, and remaining.
   - Dynamic progress bars: Green (< 75%), Amber (75-100%), Red/Alert (> 100% over-budget).
   - Real-time remaining balance calculations.
   - Set, update, and delete category budgets.
5. **Reports (`/reports`)**:
   - Detailed visual breakdowns of cash flow.
   - Category distribution analysis.
   - 6-month net savings trajectory line chart.
   - Key statistics: Average daily spend, Top expense category, Total savings rate.
   - Dedicated CSV report export.
6. **Settings (`/settings`)**:
   - Profile Details: Update user display name and email.
   - Password & Security: Change password with current password verification.
   - Category Management: View, create new custom categories with color picker, edit, and delete categories (with transaction deletion safeguards).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Ensure `.env` contains:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Development Server
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
npm run preview
```
