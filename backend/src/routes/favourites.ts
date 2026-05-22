import { Router } from 'express';
import {
  listFavourites,
  putFavourite,
  softDeleteFavourite,
} from '../adapters/dynamodb-favourites.js';
import { AppError, asyncHandler } from '../lib/errors.js';
import { HTTP_STATUS } from '../constants/index.js';
import { cognitoAuth } from '../middleware/cognito-auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { favouriteBodySchema, perfIdParamsSchema, syncBodySchema } from '../models/lineup.js';
import type { Favourite } from '@glasto/shared';

export const favouritesRouter = Router();

favouritesRouter.use(cognitoAuth);

favouritesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Missing user');
    const items = await listFavourites(req.user.sub);
    res.json({ success: true, data: items });
  }),
);

favouritesRouter.post(
  '/',
  validateBody(favouriteBodySchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Missing user');
    const fav = await putFavourite({
      perfId: req.body.perfId,
      userId: req.user.sub,
      updatedAt: req.body.updatedAt,
      deleted: false,
    });
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: fav });
  }),
);

favouritesRouter.delete<'/:perfId', { perfId: string }>(
  '/:perfId',
  validateParams(perfIdParamsSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Missing user');
    await softDeleteFavourite(req.user.sub, req.params.perfId);
    res.status(HTTP_STATUS.NO_CONTENT).end();
  }),
);

export const syncRouter = Router();
syncRouter.use(cognitoAuth);

syncRouter.post(
  '/',
  validateBody(syncBodySchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Missing user');
    const userId = req.user.sub;
    const incoming: Array<{ perfId: string; updatedAt: string; deleted?: boolean }> =
      req.body.favourites ?? [];

    await Promise.all(
      incoming.map((f) =>
        putFavourite({
          perfId: f.perfId,
          userId,
          updatedAt: f.updatedAt,
          deleted: f.deleted ?? false,
        }),
      ),
    );

    const merged = await listFavourites(userId);
    const data: Favourite[] = merged.map((f) => ({ ...f, userId }));
    res.json({ success: true, data });
  }),
);
