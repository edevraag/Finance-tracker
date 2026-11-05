import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { useAppDispatch } from '../../store';
import { createCategory, updateCategory } from '../../store/financeSlice';
import { Category } from '../../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
}

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#eab308', // Yellow
  '#64748b', // Slate
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
}) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setColor(categoryToEdit.color);
    } else {
      setName('');
      setColor('#10b981');
    }
    setError('');
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (categoryToEdit) {
        await dispatch(
          updateCategory({
            id: categoryToEdit.id,
            data: { name: name.trim(), color },
          })
        ).unwrap();
      } else {
        await dispatch(createCategory({ name: name.trim(), color })).unwrap();
      }
      onClose();
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err.message || 'Failed to save category');
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
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              {categoryToEdit ? 'Edit Category' : 'New Category'}
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
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category Name</label>
            <input
              type="text"
              required
              maxLength={40}
              placeholder="e.g. Subscriptions, Groceries, Mutual Funds"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Color Tag</label>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-slate-900 ring-white' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 p-0.5 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-400">{color}</span>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Preview</span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: `${color}25`,
                color: color,
                border: `1px solid ${color}50`,
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {name.trim() || 'Category Name'}
            </span>
          </div>

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
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-950/40 transition-colors"
            >
              {isSubmitting ? 'Saving...' : categoryToEdit ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
