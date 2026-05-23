import { Router } from 'express';
import type { Pin } from '@glasto/shared';
import { listPins, putPin } from '../adapters/dynamodb-pins.js';
import { AppError, asyncHandler } from '../lib/errors.js';
import { HTTP_STATUS } from '../constants/index.js';
import { cognitoAuth } from '../middleware/cognito-auth.js';
import { validateBody } from '../middleware/validate.js';
import { pinSyncBodySchema } from '../models/pins.js';

export const pinsRouter = Router();

pinsRouter.use(cognitoAuth);

pinsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Missing user');
    const items = await listPins(req.user.sub);
    res.json({ success: true, data: items });
  }),
);

pinsRouter.post(
  '/sync',
  validateBody(pinSyncBodySchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Missing user');
    const userId = req.user.sub;
    const incoming: Array<{
      id: string;
      label: string;
      emoji?: string;
      lat: number;
      lon: number;
      updatedAt: string;
      deleted?: boolean;
    }> = req.body.pins ?? [];

    await Promise.all(
      incoming.map((p) =>
        putPin({
          id: p.id,
          userId,
          label: p.label,
          emoji: p.emoji,
          lat: p.lat,
          lon: p.lon,
          updatedAt: p.updatedAt,
          deleted: p.deleted ?? false,
        }),
      ),
    );

    const merged = await listPins(userId);
    const data: Pin[] = merged.map((p) => ({ ...p, userId }));
    res.json({ success: true, data });
  }),
);
