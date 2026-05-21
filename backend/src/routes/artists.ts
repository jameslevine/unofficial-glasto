import { Router } from 'express';
import { getArtistBySlug } from '../adapters/dynamodb-artists.js';
import { getTopTracks } from '../lib/spotify-client.js';
import { AppError, asyncHandler } from '../lib/errors.js';
import { HTTP_STATUS } from '../constants/index.js';
import { validateParams } from '../middleware/validate.js';
import { slugParamsSchema } from '../models/lineup.js';

export const artistsRouter = Router();

artistsRouter.get(
  '/:slug',
  validateParams(slugParamsSchema),
  asyncHandler(async (req, res) => {
    const artist = await getArtistBySlug(req.params.slug);
    if (!artist) throw new AppError(HTTP_STATUS.NOT_FOUND, 'Artist not found');
    res.json({ success: true, data: artist });
  }),
);

artistsRouter.get(
  '/:slug/spotify',
  validateParams(slugParamsSchema),
  asyncHandler(async (req, res) => {
    const artist = await getArtistBySlug(req.params.slug);
    if (!artist?.spotifyId) throw new AppError(HTTP_STATUS.NOT_FOUND, 'No Spotify match');
    const tracks = await getTopTracks(artist.spotifyId);
    res.set('Cache-Control', 'public, max-age=3600');
    res.json({
      success: true,
      data: {
        topTracks: tracks,
        externalUrl: artist.spotifyUrl,
        embedUrl: `https://open.spotify.com/embed/artist/${artist.spotifyId}`,
      },
    });
  }),
);
