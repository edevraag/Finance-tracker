import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Category, Transaction, Budget, SummaryData, TransactionFilters } from '../types';
import { categoryApi } from '../api/categoryApi';
import { transactionApi } from '../api/transactionApi';
import { budgetApi } from '../api/budgetApi';
import { summaryApi } from '../api/summaryApi';

interface FinanceState {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  summary: SummaryData | null;
  activeMonth: string;
  filters: TransactionFilters;
  isLoading: boolean;
  error: string | null;
}

const currentMonthStr = new Date().toISOString().slice(0, 7);

const initialState: FinanceState = {
  categories: [],
  transactions: [],
  budgets: [],
  summary: null,
  activeMonth: currentMonthStr,
  filters: {
    month: currentMonthStr,
    type: '',
    categoryId: '',
    search: '',
    sortBy: 'date',
    sortOrder: 'desc',
  },
  isLoading: false,
  error: null,
};

// Category Thunks
export const fetchCategories = createAsyncThunk('finance/fetchCategories', async () => {
  return await categoryApi.getAll();
});

export const createCategory = createAsyncThunk(
  'finance/createCategory',
  async (data: { name: string; color?: string }) => {
    return await categoryApi.create(data);
  }
);

export const updateCategory = createAsyncThunk(
  'finance/updateCategory',
  async ({ id, data }: { id: string; data: { name?: string; color?: string } }) => {
    return await categoryApi.update(id, data);
  }
);

export const deleteCategory = createAsyncThunk(
  'finance/deleteCategory',
  async (id: string, { rejectWithValue }) => {
    try {
      await categoryApi.delete(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete category');
    }
  }
);

// Transaction Thunks
export const fetchTransactions = createAsyncThunk(
  'finance/fetchTransactions',
  async (filters: TransactionFilters) => {
    return await transactionApi.getAll(filters);
  }
);

export const createTransaction = createAsyncThunk(
  'finance/createTransaction',
  async (
    data: {
      categoryId: string;
      type: 'INCOME' | 'EXPENSE';
      amount: number;
      date: string;
      note?: string | null;
    },
    { dispatch, getState }
  ) => {
    const res = await transactionApi.create(data);
    const state = getState() as { finance: FinanceState };
    dispatch(fetchSummary(state.finance.activeMonth));
    dispatch(fetchBudgets(state.finance.activeMonth));
    return res;
  }
);

export const updateTransaction = createAsyncThunk(
  'finance/updateTransaction',
  async (
    {
      id,
      data,
    }: {
      id: string;
      data: {
        categoryId?: string;
        type?: 'INCOME' | 'EXPENSE';
        amount?: number;
        date?: string;
        note?: string | null;
      };
    },
    { dispatch, getState }
  ) => {
    const res = await transactionApi.update(id, data);
    const state = getState() as { finance: FinanceState };
    dispatch(fetchSummary(state.finance.activeMonth));
    dispatch(fetchBudgets(state.finance.activeMonth));
    return res;
  }
);

export const deleteTransaction = createAsyncThunk(
  'finance/deleteTransaction',
  async (id: string, { dispatch, getState }) => {
    await transactionApi.delete(id);
    const state = getState() as { finance: FinanceState };
    dispatch(fetchSummary(state.finance.activeMonth));
    dispatch(fetchBudgets(state.finance.activeMonth));
    return id;
  }
);

// Budget Thunks
export const fetchBudgets = createAsyncThunk('finance/fetchBudgets', async (month?: string) => {
  return await budgetApi.getAll(month);
});

export const saveBudget = createAsyncThunk(
  'finance/saveBudget',
  async (data: { categoryId: string; month: string; limitAmount: number }) => {
    return await budgetApi.upsert(data);
  }
);

export const deleteBudget = createAsyncThunk('finance/deleteBudget', async (id: string) => {
  await budgetApi.delete(id);
  return id;
});

// Summary Thunk
export const fetchSummary = createAsyncThunk('finance/fetchSummary', async (month?: string) => {
  return await summaryApi.get(month);
});

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    setActiveMonth: (state, action: PayloadAction<string>) => {
      state.activeMonth = action.payload;
      state.filters.month = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<TransactionFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        month: state.activeMonth,
        type: '',
        categoryId: '',
        search: '',
        sortBy: 'date',
        sortOrder: 'desc',
      };
    },
  },
  extraReducers: (builder) => {
    // Categories
    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.categories = action.payload;
    });
    builder.addCase(createCategory.fulfilled, (state, action) => {
      state.categories.push(action.payload);
      state.categories.sort((a, b) => a.name.localeCompare(b.name));
    });
    builder.addCase(updateCategory.fulfilled, (state, action) => {
      const idx = state.categories.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) {
        state.categories[idx] = action.payload;
        state.categories.sort((a, b) => a.name.localeCompare(b.name));
      }
    });
    builder.addCase(deleteCategory.fulfilled, (state, action) => {
      state.categories = state.categories.filter((c) => c.id !== action.payload);
    });

    // Transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch transactions';
      });

    builder.addCase(createTransaction.fulfilled, (state, action) => {
      state.transactions.unshift(action.payload);
    });

    builder.addCase(updateTransaction.fulfilled, (state, action) => {
      const idx = state.transactions.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) {
        state.transactions[idx] = action.payload;
      }
    });

    builder.addCase(deleteTransaction.fulfilled, (state, action) => {
      state.transactions = state.transactions.filter((t) => t.id !== action.payload);
    });

    // Budgets
    builder.addCase(fetchBudgets.fulfilled, (state, action) => {
      state.budgets = action.payload;
    });
    builder.addCase(saveBudget.fulfilled, (state, action) => {
      const idx = state.budgets.findIndex((b) => b.id === action.payload.id);
      if (idx !== -1) {
        state.budgets[idx] = action.payload;
      } else {
        state.budgets.push(action.payload);
      }
    });
    builder.addCase(deleteBudget.fulfilled, (state, action) => {
      state.budgets = state.budgets.filter((b) => b.id !== action.payload);
    });

    // Summary
    builder.addCase(fetchSummary.fulfilled, (state, action) => {
      state.summary = action.payload;
    });
  },
});

export const { setActiveMonth, setFilters, resetFilters } = financeSlice.actions;
export default financeSlice.reducer;
