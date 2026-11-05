import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  PieChart as PieIcon,
  CheckCircle2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchBudgets, deleteBudget, setActiveMonth } from '../store/financeSlice';
import { Budget } from '../types';
import { MonthPicker } from '../components/common/MonthPicker';
import { BudgetModal } from '../components/modals/BudgetModal';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/format';

export const BudgetsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const budgets = useAppSelector((state) => state.finance.budgets);
  const activeMonth = useAppSelector((state) => state.finance.activeMonth);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dispatch(fetchBudgets(activeMonth)).finally(() => setLoading(false));
  }, [dispatch, activeMonth]);

  const handleMonthChange = (month: string) => {
    dispatch(setActiveMonth(month));
  };

  const handleEdit = (b: Budget) => {
    setEditingBudget(b);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await dispatch(deleteBudget(deleteTarget.id));
    setDeleteTarget(null);
  };

  // Calculations for overall budget banner
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overallPercentage = totalBudgeted > 0 ? Number(((totalSpent / totalBudgeted) * 100).toFixed(1)) : 0;
  const overBudgetCount = budgets.filter((b) => b.isOverBudget).length;

  return (
    <div className="space-y-6">
      {/* Title & Month Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Monthly Budgets</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Set category limits and track remaining amounts in Indian Rupees (₹).
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <MonthPicker value={activeMonth} onChange={handleMonthChange} />
          <button
            onClick={() => {
              setEditingBudget(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Set Budget
          </button>
        </div>
      </div>

      {/* Overview Stat Banner */}
      {budgets.length > 0 && (
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Budgeted</p>
              <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(totalBudgeted)}</h3>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Spent</p>
              <h3 className="text-2xl font-bold text-slate-200 mt-1">{formatCurrency(totalSpent)}</h3>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Remaining</p>
              <h3
                className={`text-2xl font-bold mt-1 ${
                  totalRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatCurrency(totalRemaining)}
              </h3>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Utilization</p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-2xl font-bold text-white">{overallPercentage}%</h3>
                {overBudgetCount > 0 ? (
                  <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/15 border border-rose-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {overBudgetCount} exceeded
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> On Track
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-6">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                overallPercentage > 100
                  ? 'bg-rose-500'
                  : overallPercentage > 85
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Category Budgets Grid */}
      {loading ? (
        <div className="py-16 text-white">
          <LoadingSpinner size="md" text="Loading budgets..." />
        </div>
      ) : budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => {
            const isOver = b.isOverBudget;
            const progress = Math.min(b.percentageSpent, 100);
            const progressColor = isOver
              ? 'bg-rose-500'
              : progress > 85
              ? 'bg-amber-500'
              : 'bg-emerald-500';

            return (
              <div
                key={b.id}
                className={`bg-slate-900/90 rounded-2xl p-6 border transition-all duration-200 shadow-sm flex flex-col justify-between ${
                  isOver
                    ? 'border-rose-500/40 ring-1 ring-rose-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: b.category.color }}
                      />
                      <h3 className="font-bold text-white text-sm">{b.category.name}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(b)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                        title="Edit Budget Limit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(b)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete Budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        Spent
                      </span>
                      <span className="text-xl font-bold text-white block mt-0.5">
                        {formatCurrency(b.spent)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        Limit
                      </span>
                      <span className="text-xl font-bold text-slate-400 block mt-0.5">
                        {formatCurrency(b.limitAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${progressColor} transition-all duration-300 rounded-full`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Remaining amount or Warning badge */}
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-400">{b.percentageSpent}% used</span>
                    <span
                      className={`font-bold ${
                        isOver ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {isOver
                        ? `Over by ${formatCurrency(Math.abs(b.remaining))}`
                        : `${formatCurrency(b.remaining)} remaining`}
                    </span>
                  </div>
                </div>

                {isOver && (
                  <div className="mt-4 pt-3 border-t border-rose-500/20 flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>You have exceeded this category's limit.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-16 text-center shadow-sm">
          <PieIcon className="w-12 h-12 stroke-1 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-bold text-white">No Budgets Set For This Month</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Setting monthly limits on your categories helps avoid end-of-month surprises and build savings.
          </p>
          <button
            onClick={() => {
              setEditingBudget(null);
              setIsModalOpen(true);
            }}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Your First Budget
          </button>
        </div>
      )}

      {/* Modals */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        budgetToEdit={editingBudget}
        defaultMonth={activeMonth}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Budget"
        message={`Are you sure you want to remove the budget for ${deleteTarget?.category.name}? Your historical transaction records will NOT be deleted.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
