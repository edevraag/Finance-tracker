import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-800 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDangerous
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-300">{message}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition-colors ${
              isDangerous
                ? 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-900/30'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
