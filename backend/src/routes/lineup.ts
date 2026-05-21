import { Router } from 'express';
import { getLineupByYear } from '../adapters/dynamodb-lineup.js';
import { listStages } from '../adapters/dynamodb-stages.js';
import { asyncHandler } from '../lib/errors.js';
import { validateParams } from '../middleware/validate.js';
import { yearParamsSchema } from '../models/lineup.js';

export const lineupRouter = Router();

lineupRouter.get(
  '/:year',
  validateParams(yearParamsSchema),
  asyncHandler(async (req, res) => {
    const year = Number(req.params.year);
    const items = await getLineupByYear(year);
    res.json({ success: true, data: items });
  }),
);

export const stagesRouter = Router();
stagesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const stages = await listStages();
    res.json({ success: true, data: stages });
  }),
);
