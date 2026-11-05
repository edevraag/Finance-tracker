import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Helper to calculate previous YYYY-MM
function getPreviousMonthString(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 7);
}

// Helper to get past N months strings [ '2026-06', ..., '2026-11' ]
function getPastMonths(currentMonthStr: string, count: number): string[] {
  const months: string[] = [];
  const [year, month] = currentMonthStr.split('-').map(Number);
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1, 1));
    d.setUTCMonth(d.getUTCMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

// GET /api/summary
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ error: 'Invalid month format. Expected YYYY-MM' });
      return;
    }

    // 1. Current month date boundaries
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1);

    // 2. Previous month date boundaries for month-to-month comparison
    const prevMonthStr = getPreviousMonthString(month);
    const prevStartDate = new Date(`${prevMonthStr}-01T00:00:00.000Z`);
    const prevEndDate = new Date(prevStartDate);
    prevEndDate.setUTCMonth(prevEndDate.getUTCMonth() + 1);

    // 3. Date boundaries for 6-month historical trend
    const pastMonthsList = getPastMonths(month, 6);
    const trendStartDate = new Date(`${pastMonthsList[0]}-01T00:00:00.000Z`);

    const [currentTransactions, prevTransactions, trendTransactions, recentTransactions] =
      await Promise.all([
        prisma.transaction.findMany({
          where: { userId: req.userId, date: { gte: startDate, lt: endDate } },
          include: {
            category: { select: { id: true, name: true, color: true } },
          },
        }),
        prisma.transaction.findMany({
          where: { userId: req.userId, date: { gte: prevStartDate, lt: prevEndDate } },
        }),
        prisma.transaction.findMany({
          where: { userId: req.userId, date: { gte: trendStartDate, lt: endDate } },
        }),
        prisma.transaction.findMany({
          where: { userId: req.userId },
          include: {
            category: { select: { id: true, name: true, color: true } },
          },
          orderBy: { date: 'desc' },
          take: 5,
        }),
      ]);

    // Current month calculations
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdownMap: Record<
      string,
      { categoryId: string; name: string; color: string; amount: number; percentage: number }
    > = {};

    for (const t of currentTransactions) {
      if (t.type === 'INCOME') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
        if (!categoryBreakdownMap[t.categoryId]) {
          categoryBreakdownMap[t.categoryId] = {
            categoryId: t.categoryId,
            name: t.category.name,
            color: t.category.color,
            amount: 0,
            percentage: 0,
          };
        }
        categoryBreakdownMap[t.categoryId].amount += t.amount;
      }
    }

    // Compute category percentages
    const categoryBreakdown = Object.values(categoryBreakdownMap).map((cat) => ({
      ...cat,
      amount: Number(cat.amount.toFixed(2)),
      percentage: totalExpense > 0 ? Number(((cat.amount / totalExpense) * 100).toFixed(1)) : 0,
    }));
    categoryBreakdown.sort((a, b) => b.amount - a.amount);

    totalIncome = Number(totalIncome.toFixed(2));
    totalExpense = Number(totalExpense.toFixed(2));
    const balance = Number((totalIncome - totalExpense).toFixed(2));
    const savingsRate = totalIncome > 0 ? Number((((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1)) : 0;

    // Previous month calculations
    let prevTotalIncome = 0;
    let prevTotalExpense = 0;
    for (const t of prevTransactions) {
      if (t.type === 'INCOME') prevTotalIncome += t.amount;
      else prevTotalExpense += t.amount;
    }
    prevTotalIncome = Number(prevTotalIncome.toFixed(2));
    prevTotalExpense = Number(prevTotalExpense.toFixed(2));
    const prevBalance = Number((prevTotalIncome - prevTotalExpense).toFixed(2));

    const incomeChangePercentage =
      prevTotalIncome > 0
        ? Number((((totalIncome - prevTotalIncome) / prevTotalIncome) * 100).toFixed(1))
        : null;

    const expenseChangePercentage =
      prevTotalExpense > 0
        ? Number((((totalExpense - prevTotalExpense) / prevTotalExpense) * 100).toFixed(1))
        : null;

    // 6-month historical trend
    const trendMap: Record<string, { month: string; income: number; expense: number; balance: number }> = {};
    for (const m of pastMonthsList) {
      trendMap[m] = { month: m, income: 0, expense: 0, balance: 0 };
    }

    for (const t of trendTransactions) {
      const m = t.date.toISOString().slice(0, 7);
      if (trendMap[m]) {
        if (t.type === 'INCOME') trendMap[m].income += t.amount;
        else trendMap[m].expense += t.amount;
      }
    }

    const monthlyTrends = pastMonthsList.map((m) => {
      const inc = Number(trendMap[m].income.toFixed(2));
      const exp = Number(trendMap[m].expense.toFixed(2));
      return {
        month: m,
        income: inc,
        expense: exp,
        balance: Number((inc - exp).toFixed(2)),
      };
    });

    res.json({
      month,
      totalIncome,
      totalExpense,
      balance,
      savingsRate,
      transactionCount: currentTransactions.length,
      previousMonth: {
        month: prevMonthStr,
        totalIncome: prevTotalIncome,
        totalExpense: prevTotalExpense,
        balance: prevBalance,
        incomeChangePercentage,
        expenseChangePercentage,
      },
      categoryBreakdown,
      monthlyTrends,
      recentTransactions,
    });
  } catch {
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

export default router;
