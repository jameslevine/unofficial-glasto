import { Router } from 'express';
import {
  deleteFavourite,
  listFavourites,
  putFavourite,
} from '../adapters/dynamodb-favourites.js';
import { AppError, asyncHandler } from '../lib/errors.js';
import { HTTP_STATUS } from '../constants/index.js';
import { cognitoAuth } from '../middleware/cognito-auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { favouriteBodySchema, perfIdParamsSchema } from '../models/lineup.js';

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

favouritesRouter.delete(
  '/:perfId',
  validateParams(perfIdParamsSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Missing user');
    await deleteFavourite(req.user.sub, req.params.perfId);
    res.status(HTTP_STATUS.NO_CONTENT).end();
  }),
);
