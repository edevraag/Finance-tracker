import React, { useEffect, useState } from 'react';
import {
  Download,
  PieChart as PieIcon,
  TrendingUp,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchSummary, setActiveMonth } from '../store/financeSlice';
import { transactionApi } from '../api/transactionApi';
import { MonthPicker } from '../components/common/MonthPicker';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/format';

export const ReportsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const summary = useAppSelector((state) => state.finance.summary);
  const activeMonth = useAppSelector((state) => state.finance.activeMonth);

  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dispatch(fetchSummary(activeMonth)).finally(() => setLoading(false));
  }, [dispatch, activeMonth]);

  const handleMonthChange = (month: string) => {
    dispatch(setActiveMonth(month));
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const blob = await transactionApi.exportCsv({ month: activeMonth });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance_report_${activeMonth}.csv`;
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

  if (loading && !summary) {
    return (
      <div className="py-24 flex justify-center text-white">
        <LoadingSpinner size="lg" text="Generating financial reports..." />
      </div>
    );
  }

  const categoryBreakdown = summary?.categoryBreakdown || [];
  const monthlyTrends = summary?.monthlyTrends || [];
  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  // Approximate days in month for daily average
  const [yearStr, monthStr] = activeMonth.split('-');
  const daysInMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate();
  const dailyAverageExpense = (summary?.totalExpense || 0) / (daysInMonth || 30);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Financial Reports</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Spending patterns, category distributions, and multi-month trends in Indian Rupees (₹).
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <MonthPicker value={activeMonth} onChange={handleMonthChange} />
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            {isExporting ? 'Exporting...' : 'Export Monthly Report (CSV)'}
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Income</span>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1">
            {formatCurrency(summary?.totalIncome || 0)}
          </h3>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {summary?.transactionCount || 0} recorded transactions
          </span>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Expenses</span>
          <h3 className="text-2xl font-bold text-rose-400 mt-1">
            {formatCurrency(summary?.totalExpense || 0)}
          </h3>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across {categoryBreakdown.length} spending categories
          </span>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Average Daily Spend</span>
          <h3 className="text-2xl font-bold text-white mt-1">
            {formatCurrency(dailyAverageExpense)}
          </h3>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Based on {daysInMonth} days in month
          </span>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Top Category</span>
          <h3 className="text-xl font-bold text-white mt-1 truncate">
            {topCategory ? topCategory.name : 'None'}
          </h3>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {topCategory ? `${formatCurrency(topCategory.amount)} (${topCategory.percentage}%)` : 'No expenses'}
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Donut */}
        <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Category Distribution</h3>
              <p className="text-xs text-slate-400">Share of monthly expense (₹)</p>
            </div>
            <PieIcon className="w-5 h-5 text-slate-400" />
          </div>

          {categoryBreakdown.length > 0 ? (
            <div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {categoryBreakdown.map((cat, idx) => (
                        <Cell key={`cell-${idx}`} fill={cat.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${formatCurrency(Number(val))}`, 'Spent']}
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderRadius: '12px',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconSize={8}
                      formatter={(val) => <span className="text-xs text-slate-300">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Table of categories */}
              <div className="mt-4 border-t border-slate-800 divide-y divide-slate-800/80">
                {categoryBreakdown.map((c) => (
                  <div key={c.categoryId} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="font-semibold text-slate-200">{c.name}</span>
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400 font-medium">{c.percentage}%</span>
                      <span className="font-bold text-white">{formatCurrency(c.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500">
              <p className="text-xs">No expenses recorded for this month</p>
            </div>
          )}
        </div>

        {/* 6-Month Net Balance & Savings Trajectory */}
        <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Net Savings Trajectory</h3>
              <p className="text-xs text-slate-400">6-month monthly balance trend (₹)</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(value: any) => [`${formatCurrency(Number(value))}`, '']}
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Net Savings"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Summary Breakdown */}
          <div className="mt-4 border-t border-slate-800 pt-3">
            <div className="grid grid-cols-3 text-center text-xs gap-2">
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Prev Month
                </span>
                <span className="font-bold text-white block mt-0.5">
                  {formatCurrency(summary?.previousMonth?.balance || 0)}
                </span>
              </div>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  Current Month
                </span>
                <span className="font-bold text-emerald-300 block mt-0.5">
                  {formatCurrency(summary?.balance || 0)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Savings Rate
                </span>
                <span className="font-bold text-white block mt-0.5">
                  {summary?.savingsRate || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
