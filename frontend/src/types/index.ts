export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  note?: string | null;
  category: {
    id: string;
    name: string;
    color: string;
  };
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  month: string;
  limitAmount: number;
  spent: number;
  remaining: number;
  percentageSpent: number;
  isOverBudget: boolean;
  category: {
    id: string;
    name: string;
    color: string;
  };
}

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export interface PreviousMonthSummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeChangePercentage: number | null;
  expenseChangePercentage: number | null;
}

export interface SummaryData {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  transactionCount: number;
  previousMonth: PreviousMonthSummary;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
  recentTransactions: Transaction[];
}

export interface TransactionFilters {
  month?: string;
  from?: string;
  to?: string;
  categoryId?: string;
  type?: 'INCOME' | 'EXPENSE' | '';
  search?: string;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
}
