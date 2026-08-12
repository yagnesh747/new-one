import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { registerSchema } from '../validators/authValidator';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const data = await authService.loginUser(email, password);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const user = await authService.getUserById(req.user.id);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.issues.map((e) => e.message),
      });
      return;
    }

    const data = await authService.registerUser(parseResult.data);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};
