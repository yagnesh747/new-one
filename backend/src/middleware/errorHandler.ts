import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error occurred.';

  // PostgreSQL unique violation error (23505)
  if (err.code === '23505') {
    statusCode = 409;
    message = 'Duplicate entry detected. Resource already exists.';
  }

  // Log error details for server diagnostics
  if (statusCode === 500) {
    console.error('Unhandled System Error:', err);
  }

  res.status(statusCode).json({
    status: statusCode < 500 ? 'fail' : 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
