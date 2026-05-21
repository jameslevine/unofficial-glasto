import type { NextFunction, Request, Response } from 'express';
import type { Schema } from 'joi';
import { AppError } from '../lib/errors.js';
import { HTTP_STATUS } from '../constants/index.js';

const validate =
  (source: 'body' | 'query' | 'params') =>
  (schema: Schema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[source]);
    if (error) {
      return next(
        new AppError(HTTP_STATUS.BAD_REQUEST, `Validation error: ${error.details[0]?.message}`),
      );
    }
    req[source] = value;
    next();
  };

export const validateBody = validate('body');
export const validateQuery = validate('query');
export const validateParams = validate('params');
