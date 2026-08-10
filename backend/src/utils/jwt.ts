import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserRole } from '../models/user.model';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_minierp_crm_2026_dev';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
