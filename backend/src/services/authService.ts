import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { User, AuthUserPayload } from '../types';
import * as mem from './memoryStore';

export const loginUser = async (email: string, password: string) => {
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) throw new AppError('Invalid email or password.', 401);
    const user: User = result.rows[0];
    if (!(await bcrypt.compare(password, user.password_hash))) throw new AppError('Invalid email or password.', 401);
    const jwtSecret = process.env.JWT_SECRET || 'stockly_super_secret_jwt_key_2026_production';
    const payload: AuthUserPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
    return { token: jwt.sign(payload, jwtSecret, { expiresIn: '24h' }), user: payload };
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    // fallback
    const user = mem.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) throw new AppError('Invalid email or password.', 401);
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new AppError('Invalid email or password.', 401);
    const jwtSecret = process.env.JWT_SECRET || 'stockly_super_secret_jwt_key_2026_production';
    const payload: AuthUserPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
    return { token: jwt.sign(payload, jwtSecret, { expiresIn: '24h' }), user: payload };
  }
};

export const getUserById = async (id: number): Promise<AuthUserPayload> => {
  try {
    const result = await query('SELECT id, email, name, role FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) throw new AppError('User not found.', 404);
    return result.rows[0];
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    const user = mem.users.find(u => u.id === id);
    if (!user) throw new AppError('User not found.', 404);
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
};

export const registerUser = async (data: { name: string; email: string; password: string; role: 'Admin' | 'Sales' | 'Warehouse' | 'Accounts' }) => {
  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [data.email]);
    if (existing.rows.length > 0) throw new AppError('A user with this email address already exists.', 400);
    const hash = await bcrypt.hash(data.password, 10);
    const insertResult = await query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [data.name, data.email, hash, data.role]
    );
    const newUser: AuthUserPayload = insertResult.rows[0];
    const jwtSecret = process.env.JWT_SECRET || 'stockly_super_secret_jwt_key_2026_production';
    return { token: jwt.sign(newUser, jwtSecret, { expiresIn: '24h' }), user: newUser };
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    // fallback
    if (mem.users.some(u => u.email.toLowerCase() === data.email.trim().toLowerCase())) {
      throw new AppError('A user with this email address already exists.', 400);
    }
    const hash = await bcrypt.hash(data.password, 10);
    const newId = mem.nextId.user();
    const now = new Date();
    mem.users.push({ id: newId, name: data.name, email: data.email, password_hash: hash, role: data.role, created_at: now, updated_at: now });
    const payload: AuthUserPayload = { id: newId, name: data.name, email: data.email, role: data.role };
    const jwtSecret = process.env.JWT_SECRET || 'stockly_super_secret_jwt_key_2026_production';
    return { token: jwt.sign(payload, jwtSecret, { expiresIn: '24h' }), user: payload };
  }
};
