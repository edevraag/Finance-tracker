import React, { useEffect, useState } from 'react';
import {
  Plus,
  Download,
  Search,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchTransactions,
  deleteTransaction,
  setFilters,
  resetFilters,
} from '../store/financeSlice';
import { transactionApi } from '../api/transactionApi';
import { Transaction } from '../types';
import { Badge } from '../components/common/Badge';
import { MonthPicker } from '../components/common/MonthPicker';
import { TransactionModal } from '../components/modals/TransactionModal';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/format';

export const TransactionsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const transactions = useAppSelector((state) => state.finance.transactions);
  const categories = useAppSelector((state) => state.finance.categories);
  const filters = useAppSelector((state) => state.finance.filters);
  const activeMonth = useAppSelector((state) => state.finance.activeMonth);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dispatch(fetchTransactions(filters)).finally(() => setLoading(false));
  }, [dispatch, filters]);

  const handleMonthChange = (month: string) => {
    dispatch(setFilters({ month }));
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await dispatch(deleteTransaction(deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const blob = await transactionApi.exportCsv(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${filters.month || 'all'}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export CSV', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Transactions</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Record, filter and manage all your income and expenses in Indian Rupees (₹).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCsv}
            disabled={isExporting || transactions.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>

          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-3">
        {/* Row 1: Month selector & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="shrink-0">
            <MonthPicker value={filters.month || activeMonth} onChange={handleMonthChange} />
          </div>

          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search note or description..."
              value={filters.search || ''}
              onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white placeholder-slate-500"
            />
          </div>
        </div>

        {/* Row 2: Filter Options & Sorting */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2.5">
          {/* Type filter */}
          <div className="min-w-[130px] flex-1 sm:flex-initial">
            <select
              value={filters.type || ''}
              onChange={(e) => dispatch(setFilters({ type: e.target.value as any }))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-200"
            >
              <option value="" className="bg-slate-900">All Types</option>
              <option value="INCOME" className="bg-slate-900">Income Only</option>
              <option value="EXPENSE" className="bg-slate-900">Expense Only</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="min-w-[160px] flex-1 sm:flex-initial">
            <select
              value={filters.categoryId || ''}
              onChange={(e) => dispatch(setFilters({ categoryId: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-200"
            >
              <option value="" className="bg-slate-900">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort order */}
          <div className="min-w-[150px] flex-1 sm:flex-initial">
            <select
              value={`${filters.sortBy || 'date'}-${filters.sortOrder || 'desc'}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [any, any];
                dispatch(setFilters({ sortBy, sortOrder }));
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-200"
            >
              <option value="date-desc" className="bg-slate-900">Newest First</option>
              <option value="date-asc" className="bg-slate-900">Oldest First</option>
              <option value="amount-desc" className="bg-slate-900">Highest Amount</option>
              <option value="amount-asc" className="bg-slate-900">Lowest Amount</option>
            </select>
          </div>

          {/* Reset Filters button */}
          <button
            onClick={() => dispatch(resetFilters())}
            className="p-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0 ml-auto cursor-pointer"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-white">
            <LoadingSpinner size="md" text="Loading transactions..." />
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Note</th>
                  <th className="py-3.5 px-6 text-right">Amount (₹)</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 text-slate-400 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <Badge color={tx.category.color}>{tx.category.name}</Badge>
                    </td>
                    <td className="py-4 px-6 max-w-xs truncate text-slate-200">
                      {tx.note || <span className="text-slate-500 italic">No note</span>}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <span
                        className={`font-bold inline-flex items-center gap-1 ${
                          tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {tx.type === 'INCOME' ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                          title="Edit Transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500">
            <Receipt className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No transactions found</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your filters or record a new transaction.
            </p>
            <button
              onClick={() => {
                setEditingTransaction(null);
                setIsModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Transaction
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transactionToEdit={editingTransaction}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Transaction"
        message={`Are you sure you want to delete this ${deleteTarget?.type.toLowerCase()} of ${formatCurrency(
          deleteTarget?.amount || 0
        )}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
