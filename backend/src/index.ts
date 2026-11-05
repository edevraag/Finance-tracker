import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PORT, CORS_ORIGIN } from './config';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import budgetRoutes from './routes/budgets';
import summaryRoutes from './routes/summary';
import categoryRoutes from './routes/categories';

const app = express();

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (
        CORS_ORIGIN.includes('*') ||
        CORS_ORIGIN.includes(origin) ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/summary', summaryRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Application Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Finance Tracker backend running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
