import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format (e.g. 2026-11)'),
  limitAmount: z.coerce.number().finite('Limit amount must be a valid number').positive('Limit amount must be greater than 0'),
});

// GET /api/budgets
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ error: 'Invalid month format. Expected YYYY-MM' });
      return;
    }

    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1);

    const [budgets, expenses] = await Promise.all([
      prisma.budget.findMany({
        where: { userId: req.userId, month },
        include: {
          category: {
            select: { id: true, name: true, color: true },
          },
        },
        orderBy: { category: { name: 'asc' } },
      }),
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId: req.userId,
          type: 'EXPENSE',
          date: { gte: startDate, lt: endDate },
        },
        _sum: { amount: true },
      }),
    ]);

    const spentMap = new Map<string, number>(
      expenses.map((e) => [e.categoryId, e._sum.amount || 0])
    );

    const result = budgets.map((b) => {
      const spent = spentMap.get(b.categoryId) || 0;
      const remaining = Number((b.limitAmount - spent).toFixed(2));
      const percentageSpent = b.limitAmount > 0 ? Number(((spent / b.limitAmount) * 100).toFixed(1)) : 0;
      return {
        ...b,
        spent,
        remaining,
        percentageSpent,
        isOverBudget: spent > b.limitAmount,
      };
    });

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// GET /api/budgets/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const budget = await prisma.budget.findFirst({
      where: { id, userId: req.userId },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    if (!budget) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }

    const startDate = new Date(`${budget.month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1);

    const expenseAggregate = await prisma.transaction.aggregate({
      where: {
        userId: req.userId,
        categoryId: budget.categoryId,
        type: 'EXPENSE',
        date: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
    });

    const spent = expenseAggregate._sum.amount || 0;
    const remaining = Number((budget.limitAmount - spent).toFixed(2));
    const percentageSpent = budget.limitAmount > 0 ? Number(((spent / budget.limitAmount) * 100).toFixed(1)) : 0;

    res.json({
      ...budget,
      spent,
      remaining,
      percentageSpent,
      isOverBudget: spent > budget.limitAmount,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// POST /api/budgets
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = budgetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid budget data' });
      return;
    }

    const { categoryId, month, limitAmount } = parsed.data;

    // Verify category belongs to user
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: req.userId },
    });

    if (!category) {
      res.status(400).json({ error: 'Invalid category: category does not exist or belong to you' });
      return;
    }

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month: {
          userId: req.userId!,
          categoryId,
          month,
        },
      },
      update: { limitAmount },
      create: {
        userId: req.userId!,
        categoryId,
        month,
        limitAmount,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    // Calculate current spent for this category/month
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1);

    const expenseAggregate = await prisma.transaction.aggregate({
      where: {
        userId: req.userId,
        categoryId,
        type: 'EXPENSE',
        date: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
    });

    const spent = expenseAggregate._sum.amount || 0;
    const remaining = Number((budget.limitAmount - spent).toFixed(2));
    const percentageSpent = budget.limitAmount > 0 ? Number(((spent / budget.limitAmount) * 100).toFixed(1)) : 0;

    res.status(201).json({
      ...budget,
      spent,
      remaining,
      percentageSpent,
      isOverBudget: spent > budget.limitAmount,
    });
  } catch {
    res.status(500).json({ error: 'Failed to save budget' });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.budget.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }

    await prisma.budget.delete({ where: { id } });
    res.json({ message: 'Budget deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

export default router;
