import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'finance_tracker_super_secret_jwt_key_2026_dev_prod';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];
