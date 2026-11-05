import React, { useState, useEffect } from 'react';
import { X, Target } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { saveBudget, fetchBudgets } from '../../store/financeSlice';
import { Budget } from '../../types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetToEdit?: Budget | null;
  defaultMonth?: string;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budgetToEdit,
  defaultMonth,
}) => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.finance.categories);
  const activeMonth = useAppSelector((state) => state.finance.activeMonth);

  const [categoryId, setCategoryId] = useState('');
  const [month, setMonth] = useState(defaultMonth || activeMonth);
  const [limitAmount, setLimitAmount] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (budgetToEdit) {
      setCategoryId(budgetToEdit.categoryId);
      setMonth(budgetToEdit.month);
      setLimitAmount(String(budgetToEdit.limitAmount));
    } else {
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setMonth(defaultMonth || activeMonth);
      setLimitAmount('');
    }
    setError('');
  }, [budgetToEdit, categories, defaultMonth, activeMonth, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const limit = parseFloat(limitAmount);
    if (isNaN(limit) || limit <= 0) {
      setError('Budget limit must be a valid positive number');
      return;
    }

    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      setError('Please select a valid month in YYYY-MM format');
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        saveBudget({
          categoryId,
          month,
          limitAmount: limit,
        })
      ).unwrap();

      dispatch(fetchBudgets(month));
      onClose();
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err.message || 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-800 text-white">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              {budgetToEdit ? 'Update Budget' : 'Set Monthly Budget'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!!budgetToEdit}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-white disabled:opacity-50"
            >
              <option value="" disabled className="bg-slate-900">
                Select category
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Month</label>
            <input
              type="month"
              required
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              disabled={!!budgetToEdit}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-white disabled:opacity-50"
            />
          </div>

          {/* Limit Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Monthly Limit (₹)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold font-mono text-sm">
                ₹
              </span>
              <input
                type="number"
                step="1"
                min="1"
                required
                placeholder="e.g. 15000"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm font-semibold text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-950/40 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? 'Saving...' : budgetToEdit ? 'Save Changes' : 'Set Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
