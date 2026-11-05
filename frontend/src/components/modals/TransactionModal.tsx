import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { createTransaction, updateTransaction } from '../../store/financeSlice';
import { Transaction } from '../../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
}) => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.finance.categories);

  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(String(transactionToEdit.amount));
      setCategoryId(transactionToEdit.categoryId);
      setDate(transactionToEdit.date.slice(0, 10));
      setNote(transactionToEdit.note || '');
    } else {
      setType('EXPENSE');
      setAmount('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setDate(new Date().toISOString().slice(0, 10));
      setNote('');
    }
    setError('');
  }, [transactionToEdit, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a valid positive number');
      return;
    }

    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    if (!date) {
      setError('Please select a valid date');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type,
        amount: numAmount,
        categoryId,
        date: new Date(date).toISOString(),
        note: note.trim() || null,
      };

      if (transactionToEdit) {
        await dispatch(updateTransaction({ id: transactionToEdit.id, data: payload })).unwrap();
      } else {
        await dispatch(createTransaction(payload)).unwrap();
      }

      onClose();
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-800 text-white">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">
            {transactionToEdit ? 'Edit Transaction' : 'Record Transaction'}
          </h3>
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
          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Transaction Type</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  type === 'EXPENSE'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  type === 'INCOME'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Income
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Amount (₹)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold font-mono text-sm">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="e.g. 2500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm font-semibold text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-white"
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

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-white"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Weekly groceries, Fuel, Dinner with team"
              maxLength={255}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-white placeholder-slate-500"
            />
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
              {isSubmitting ? 'Saving...' : transactionToEdit ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
