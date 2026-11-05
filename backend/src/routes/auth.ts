import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma';
import { JWT_SECRET } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be under 50 characters'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50).optional(),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const DEFAULT_CATEGORIES = [
  { name: 'Salary', color: '#10b981' },
  { name: 'Food & Dining', color: '#f59e0b' },
  { name: 'Rent & Housing', color: '#3b82f6' },
  { name: 'Shopping', color: '#ec4899' },
  { name: 'Transport', color: '#8b5cf6' },
  { name: 'Entertainment', color: '#06b6d4' },
  { name: 'Utilities', color: '#64748b' },
];

const signToken = (userId: string): string =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid registration data' });
      return;
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'Email is already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        categories: { create: DEFAULT_CATEGORIES },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      token: signToken(user.id),
      user,
    });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(400).json({ error: 'Email is already registered' });
      return;
    }
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid login data' });
      return;
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    res.status(200).json({
      token: signToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid profile data' });
      return;
    }

    const { name, email } = parsed.data;
    if (!name && !email) {
      res.status(400).json({ error: 'No fields provided to update' });
      return;
    }

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== req.userId) {
        res.status(400).json({ error: 'Email is already in use by another account' });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    res.json({ user: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PATCH /api/auth/change-password
router.patch('/change-password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid password data' });
      return;
    }

    const { currentPassword, newPassword } = parsed.data;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { passwordHash },
    });

    res.json({ message: 'Password updated successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;
