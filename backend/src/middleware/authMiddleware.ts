import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUserPayload } from '../types';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ message: 'Authentication required. No token provided.' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET || 'stockly_super_secret_jwt_key_2026_production';

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
    return;
  }
};
