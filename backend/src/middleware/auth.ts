import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

export interface AuthRequest extends Request {
  userId?: string;
}

interface JwtPayload {
  userId: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded || !decoded.userId) {
      res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
      return;
    }
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
  }
};
