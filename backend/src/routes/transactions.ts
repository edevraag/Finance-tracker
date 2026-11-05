import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const transactionSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.coerce.number().finite('Amount must be a valid number').positive('Amount must be greater than 0'),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date format'),
  note: z.string().max(255, 'Note cannot exceed 255 characters').optional().nullable(),
});

const updateTransactionSchema = z.object({
  categoryId: z.string().min(1, 'Category is required').optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  amount: z.coerce.number().finite('Amount must be a valid number').positive('Amount must be greater than 0').optional(),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date format').optional(),
  note: z.string().max(255, 'Note cannot exceed 255 characters').optional().nullable(),
});

// Shared filter builder for list and export
function buildWhere(userId: string, query: Record<string, any>) {
  const { month, categoryId, type, search, from, to } = query;
  const where: any = { userId };

  if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1);
    where.date = { gte: startDate, lt: endDate };
  } else if (typeof from === 'string' || typeof to === 'string') {
    where.date = {};
    if (typeof from === 'string' && !isNaN(Date.parse(from))) {
      where.date.gte = new Date(from);
    }
    if (typeof to === 'string' && !isNaN(Date.parse(to))) {
      const toDate = new Date(to);
      // If it's a date-only string like "2026-11-06", include the full day
      if (to.length === 10) {
        toDate.setUTCHours(23, 59, 59, 999);
      }
      where.date.lte = toDate;
    }
  }

  if (typeof categoryId === 'string' && categoryId.trim()) {
    where.categoryId = categoryId.trim();
  }

  if (type === 'INCOME' || type === 'EXPENSE') {
    where.type = type;
  }

  if (typeof search === 'string' && search.trim()) {
    where.note = { contains: search.trim(), mode: 'insensitive' };
  }

  return where;
}

// GET /api/transactions
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sortBy = req.query.sortBy === 'amount' ? 'amount' : 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const transactions = await prisma.transaction.findMany({
      where: buildWhere(req.userId!, req.query),
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
    });

    res.json(transactions);
  } catch {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /api/transactions/export -> CSV download
router.get('/export', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: buildWhere(req.userId!, req.query),
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const escapeCsvField = (value: unknown): string => {
      let str = String(value ?? '');
      // Prevent spreadsheet formula injection
      if (/^[=+\-@]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];
    const rows = transactions.map((t) =>
      [
        t.date.toISOString().slice(0, 10),
        t.type,
        t.category.name,
        t.amount.toFixed(2),
        t.note ?? '',
      ]
        .map(escapeCsvField)
        .join(',')
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send([headers.join(','), ...rows].join('\r\n'));
  } catch {
    res.status(500).json({ error: 'Failed to export transactions' });
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json(transaction);
  } catch {
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// POST /api/transactions
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = transactionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid transaction data' });
      return;
    }

    const { categoryId, type, amount, date, note } = parsed.data;

    // Verify category exists and belongs to the user
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: req.userId },
    });

    if (!category) {
      res.status(400).json({ error: 'Invalid category: category does not exist or belong to you' });
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.userId!,
        categoryId,
        type,
        amount,
        date: new Date(date),
        note: note ? note.trim() : null,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    res.status(201).json(transaction);
  } catch {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// PATCH /api/transactions/:id
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    const parsed = updateTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid transaction update' });
      return;
    }

    const { categoryId, type, amount, date, note } = parsed.data;

    if (categoryId && categoryId !== existing.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId: req.userId },
      });
      if (!category) {
        res.status(400).json({ error: 'Invalid category: category does not exist or belong to you' });
        return;
      }
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(categoryId ? { categoryId } : {}),
        ...(type ? { type } : {}),
        ...(amount !== undefined ? { amount } : {}),
        ...(date ? { date: new Date(date) } : {}),
        ...(note !== undefined ? { note: note ? note.trim() : null } : {}),
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    await prisma.transaction.delete({ where: { id } });
    res.json({ message: 'Transaction deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
