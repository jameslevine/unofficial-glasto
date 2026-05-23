import { Router } from 'express';
import Joi from 'joi';
import { getPoisByYear } from '../adapters/dynamodb-poi.js';
import { asyncHandler } from '../lib/errors.js';
import { validateQuery } from '../middleware/validate.js';

const poiQuerySchema = Joi.object({
  year: Joi.number().integer().min(1970).max(2100).required(),
});

export const poiRouter = Router();

poiRouter.get(
  '/',
  validateQuery(poiQuerySchema),
  asyncHandler(async (req, res) => {
    const year = Number(req.query.year);
    const pois = await getPoisByYear(year);
    res.set('Cache-Control', 'public, max-age=86400');
    res.json({ success: true, data: pois });
  }),
);
