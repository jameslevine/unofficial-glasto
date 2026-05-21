import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import { HTTP_STATUS } from '../constants/index.js';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }
  console.error('Unhandled error', err);
  return res.status(HTTP_STATUS.INTERNAL).json({ success: false, error: 'Internal server error' });
};
