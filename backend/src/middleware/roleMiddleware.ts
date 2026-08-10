import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/user.model';
import { AppError } from '../utils/appError';

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(`Access denied. Role '${req.user.role}' is not authorized to perform this operation.`, 403)
      );
    }

    next();
  };
};
