import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface MonthPickerProps {
  value: string; // "YYYY-MM"
  onChange: (month: string) => void;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({ value, onChange }) => {
  const [yearStr, monthStr] = value.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const date = new Date(Date.UTC(year, month - 1, 1));
  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  const handlePrev = () => {
    const prev = new Date(Date.UTC(year, month - 2, 1));
    onChange(prev.toISOString().slice(0, 7));
  };

  const handleNext = () => {
    const next = new Date(Date.UTC(year, month, 1));
    onChange(next.toISOString().slice(0, 7));
  };

  const handleCurrent = () => {
    const now = new Date().toISOString().slice(0, 7);
    onChange(now);
  };

  return (
    <div className="inline-flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 shadow-sm">
      <button
        onClick={handlePrev}
        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        title="Previous Month"
        aria-label="Previous Month"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 px-2 text-xs font-semibold text-slate-200 min-w-[130px] justify-center">
        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
        <span>{monthName}</span>
      </div>

      <button
        onClick={handleNext}
        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        title="Next Month"
        aria-label="Next Month"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <button
        onClick={handleCurrent}
        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors ml-1"
      >
        Current
      </button>
    </div>
  );
};
