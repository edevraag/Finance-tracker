import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(40, 'Name must be 40 characters or less'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid 6-character hex code like #10b981')
    .optional(),
});

// GET /api/categories
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const category = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json(category);
  } catch {
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// POST /api/categories
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid category data' });
      return;
    }

    const { name, color } = parsed.data;

    // Check unique category name per user
    const existing = await prisma.category.findFirst({
      where: {
        userId: req.userId,
        name: { equals: name, mode: 'insensitive' },
      },
    });

    if (existing) {
      res.status(400).json({ error: 'You already have a category with that name' });
      return;
    }

    const category = await prisma.category.create({
      data: {
        userId: req.userId!,
        name,
        ...(color ? { color } : {}),
      },
    });

    res.status(201).json(category);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(400).json({ error: 'You already have a category with that name' });
      return;
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PATCH /api/categories/:id
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const parsed = categorySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid category data' });
      return;
    }

    const { name, color } = parsed.data;

    if (name && name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.category.findFirst({
        where: {
          userId: req.userId,
          name: { equals: name, mode: 'insensitive' },
          id: { not: id },
        },
      });

      if (duplicate) {
        res.status(400).json({ error: 'You already have a category with that name' });
        return;
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(color ? { color } : {}),
      },
    });

    res.json(updated);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(400).json({ error: 'You already have a category with that name' });
      return;
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Transactions use onDelete: Restrict, so check first and provide a helpful message
    const count = await prisma.transaction.count({
      where: { categoryId: id, userId: req.userId },
    });

    if (count > 0) {
      res.status(400).json({
        error: `This category has ${count} transaction(s). Reassign or delete them first.`,
      });
      return;
    }

    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
