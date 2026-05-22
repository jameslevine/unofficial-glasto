import cors from 'cors';
import express from 'express';
import { artistsRouter } from './routes/artists.js';
import { errorHandler } from './middleware/error-handler.js';
import { favouritesRouter, syncRouter } from './routes/favourites.js';
import { lineupRouter, stagesRouter } from './routes/lineup.js';

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 300,
    }),
  );
  app.use(express.json());

  app.get('/v1/health', (_req, res) => res.json({ success: true, data: { ok: true } }));
  app.use('/v1/lineup', lineupRouter);
  app.use('/v1/stages', stagesRouter);
  app.use('/v1/artists', artistsRouter);
  app.use('/v1/me/favourites', favouritesRouter);
  app.use('/v1/me/sync', syncRouter);

  app.use(errorHandler);
  return app;
};
