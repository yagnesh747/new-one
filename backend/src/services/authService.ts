import { db } from '../config/db';
import { User, UserResponse } from '../models/user.model';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../utils/appError';

export class AuthService {
  static async login(email: string, password: string) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query<User>(query, [email.toLowerCase().trim()]);

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    const user = result.rows[0];
    const isPasswordValid = await comparePassword(password, user.password_hash!);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    });

    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at,
    };

    return {
      token,
      user: userResponse,
    };
  }

  static async getCurrentUser(userId: string): Promise<UserResponse> {
    const query = 'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1';
    const result = await db.query<UserResponse>(query, [userId]);

    if (result.rows.length === 0) {
      throw new AppError('User session not found.', 404);
    }

    return result.rows[0];
  }

  static async getAllUsers(): Promise<UserResponse[]> {
    const query = 'SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at ASC';
    const result = await db.query<UserResponse>(query);
    return result.rows;
  }

  static async register(data: { email: string; password: string; full_name: string; role?: 'Admin' | 'Sales' | 'Warehouse' | 'Accounts' }) {
    const emailClean = data.email.toLowerCase().trim();
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [emailClean]);
    if (existing.rows.length > 0) {
      throw new AppError('User with this email already exists.', 400);
    }

    const { hashPassword } = await import('../utils/password');
    const { EmailService } = await import('./emailService');

    const hashedPassword = await hashPassword(data.password);
    const userId = `u-${Date.now()}`;
    const userRole = data.role || 'Sales';

    const insertQuery = `
      INSERT INTO users (id, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, full_name, role, created_at
    `;
    const res = await db.query<UserResponse>(insertQuery, [
      userId,
      emailClean,
      hashedPassword,
      data.full_name,
      userRole,
    ]);

    const newUser = res.rows[0];

    // Trigger email notification to emperoryagnesh@gmail.com
    EmailService.sendRegistrationNotification({
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role,
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      full_name: newUser.full_name,
    });

    return { token, user: newUser };
  }
}
