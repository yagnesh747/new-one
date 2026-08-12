import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: `Forbidden. Role '${req.user.role}' does not have permission to perform this action. Required: [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
};
