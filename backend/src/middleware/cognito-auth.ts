import type { NextFunction, Request, Response } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AppError } from '../lib/errors.js';
import {
  COGNITO_CLIENT_ID_ENV,
  COGNITO_USER_POOL_ID_ENV,
  HTTP_STATUS,
} from '../constants/index.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { sub: string; email?: string };
  }
}

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | undefined;

const getVerifier = () => {
  if (verifier) return verifier;
  const userPoolId = process.env[COGNITO_USER_POOL_ID_ENV];
  const clientId = process.env[COGNITO_CLIENT_ID_ENV];
  if (!userPoolId || !clientId) {
    throw new Error('Cognito env vars not configured');
  }
  verifier = CognitoJwtVerifier.create({
    userPoolId,
    clientId,
    tokenUse: 'id',
  });
  return verifier;
};

export const cognitoAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Missing bearer token');
    const payload = await getVerifier().verify(token);
    req.user = { sub: payload.sub, email: payload.email as string | undefined };
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token'));
  }
};
