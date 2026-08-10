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
}
