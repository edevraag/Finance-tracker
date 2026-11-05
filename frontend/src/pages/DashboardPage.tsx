import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Plus,
  ArrowRight,
  Receipt,
  PieChart as PieIcon,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchSummary, fetchBudgets, setActiveMonth } from '../store/financeSlice';
import { StatCard } from '../components/common/StatCard';
import { MonthPicker } from '../components/common/MonthPicker';
import { Badge } from '../components/common/Badge';
import { TransactionModal } from '../components/modals/TransactionModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/format';

export const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeMonth = useAppSelector((state) => state.finance.activeMonth);
  const summary = useAppSelector((state) => state.finance.summary);
  const budgets = useAppSelector((state) => state.finance.budgets);
  const user = useAppSelector((state) => state.auth.user);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dispatch(fetchSummary(activeMonth)),
      dispatch(fetchBudgets(activeMonth)),
    ]).finally(() => setLoading(false));
  }, [dispatch, activeMonth]);

  const handleMonthChange = (newMonth: string) => {
    dispatch(setActiveMonth(newMonth));
  };

  if (loading && !summary) {
    return (
      <div className="py-24 flex justify-center text-white">
        <LoadingSpinner size="lg" text="Loading dashboard insights..." />
      </div>
    );
  }

  const categoryBreakdown = summary?.categoryBreakdown || [];
  const monthlyTrends = summary?.monthlyTrends || [];
  const recentTransactions = summary?.recentTransactions || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Hi, {user?.name ? user.name.split(' ')[0] : 'there'} 👋
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Overview of your personal income, expenses, and savings in Indian Rupees (₹).
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <MonthPicker value={activeMonth} onChange={handleMonthChange} />
          <button
            onClick={() => setIsTxModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Balance"
          value={formatCurrency(summary?.balance || 0)}
          icon={Wallet}
          iconBgColor="bg-blue-500/10"
          iconColor="text-blue-400"
          subtitle="Net monthly savings balance"
        />

        <StatCard
          title="Total Income"
          value={formatCurrency(summary?.totalIncome || 0)}
          icon={ArrowUpRight}
          iconBgColor="bg-emerald-500/10"
          iconColor="text-emerald-400"
          changePercentage={summary?.previousMonth?.incomeChangePercentage}
          changeLabel="vs last month"
        />

        <StatCard
          title="Total Expenses"
          value={formatCurrency(summary?.totalExpense || 0)}
          icon={ArrowDownRight}
          iconBgColor="bg-rose-500/10"
          iconColor="text-rose-400"
          changePercentage={summary?.previousMonth?.expenseChangePercentage}
          changeLabel="vs last month"
        />

        <StatCard
          title="Savings Rate"
          value={`${summary?.savingsRate || 0}%`}
          icon={PiggyBank}
          iconBgColor="bg-amber-500/10"
          iconColor="text-amber-400"
          subtitle={
            (summary?.totalIncome || 0) > 0
              ? `${formatCurrency(summary?.balance || 0)} saved of income`
              : 'Record income to calculate'
          }
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6-Month Income vs Expense Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Income vs. Expenses Trend</h2>
              <p className="text-xs text-slate-400">Past 6 months cash flow (₹)</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Expenses
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
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
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown Pie Chart */}
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Expenses by Category</h2>
              <p className="text-xs text-slate-400">Share of monthly spend (₹)</p>
            </div>
            <PieIcon className="w-4 h-4 text-slate-400" />
          </div>

          {categoryBreakdown.length > 0 ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categoryBreakdown.map((cat, idx) => (
                        <Cell key={`cell-${idx}`} fill={cat.color || '#10b981'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${formatCurrency(Number(value))}`, 'Spent']}
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

              <div className="mt-4 divide-y divide-slate-800/80 max-h-36 overflow-y-auto">
                {categoryBreakdown.slice(0, 4).map((cat) => (
                  <div key={cat.categoryId} className="py-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium text-slate-300">{cat.name}</span>
                    </span>
                    <span className="font-semibold text-white">
                      {formatCurrency(cat.amount)} ({cat.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 stroke-1 mb-2 text-slate-600" />
              <p className="text-xs">No expenses recorded for this month</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Budget Progress & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Progress Widget */}
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Budget Progress</h2>
              <p className="text-xs text-slate-400">Tracking monthly limits (₹)</p>
            </div>
            <Link
              to="/budgets"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {budgets.length > 0 ? (
            <div className="space-y-4 flex-1">
              {budgets.slice(0, 4).map((b) => {
                const isOver = b.isOverBudget;
                const progress = Math.min(b.percentageSpent, 100);
                const progressColor = isOver
                  ? 'bg-rose-500'
                  : progress > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500';

                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">{b.category.name}</span>
                      <span className="text-slate-400">
                        <span className="font-bold text-white">{formatCurrency(b.spent)}</span> /{' '}
                        {formatCurrency(b.limitAmount)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${progressColor} transition-all duration-300 rounded-full`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isOver ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                        {isOver ? `Over budget by ${formatCurrency(Math.abs(b.remaining))}` : `${b.percentageSpent}% spent`}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {b.remaining >= 0 ? `${formatCurrency(b.remaining)} left` : 'Exceeded'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <PieIcon className="w-8 h-8 stroke-1 mb-2 text-slate-600" />
              <p className="text-xs">No monthly budgets set yet</p>
              <Link
                to="/budgets"
                className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
              >
                Set a budget
              </Link>
            </div>
          )}
        </div>

        {/* Recent Transactions Widget */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Recent Transactions</h2>
              <p className="text-xs text-slate-400">Latest recorded income & expenses (₹)</p>
            </div>
            <Link
              to="/transactions"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="divide-y divide-slate-800/80 flex-1">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'INCOME'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {tx.type === 'INCOME' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {tx.note || tx.category.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge color={tx.category.color}>{tx.category.name}</Badge>
                        <span className="text-[11px] text-slate-400">
                          {new Date(tx.date).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-bold shrink-0 ${
                      tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <Receipt className="w-8 h-8 stroke-1 mb-2 text-slate-600" />
              <p className="text-xs">No transactions recorded yet</p>
              <button
                onClick={() => setIsTxModalOpen(true)}
                className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                Record your first transaction
              </button>
            </div>
          )}
        </div>
      </div>

      <TransactionModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} />
    </div>
  );
};
