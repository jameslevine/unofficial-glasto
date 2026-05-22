import { Router } from 'express';
import Joi from 'joi';
import type { Artist } from '@glasto/shared';
import { getArtistBySlug, putArtist } from '../adapters/dynamodb-artists.js';
import { getTopTracks, searchArtist } from '../lib/spotify-client.js';
import { AppError, asyncHandler } from '../lib/errors.js';
import { HTTP_STATUS } from '../constants/index.js';
import { validateParams, validateQuery } from '../middleware/validate.js';
import { slugParamsSchema } from '../models/lineup.js';

const RESOLVE_TTL_DAYS = 30;

const isFresh = (artist: Artist): boolean => {
  if (!artist.lastResolvedAt) return false;
  const age = Date.now() - new Date(artist.lastResolvedAt).getTime();
  return age < RESOLVE_TTL_DAYS * 24 * 60 * 60 * 1000;
};

const blankArtist = (slug: string, name: string): Artist => ({
  slug,
  name,
  spotifyId: null,
  spotifyUrl: null,
  imageUrl: null,
  genres: [],
  topTracks: [],
  lastResolvedAt: new Date().toISOString(),
});

const resolveAndCache = async (slug: string, name: string): Promise<Artist> => {
  try {
    const match = await searchArtist(name);
    if (!match) {
      const blank = blankArtist(slug, name);
      await putArtist(blank);
      return blank;
    }
    const tracks = await getTopTracks(match.id).catch((err) => {
      console.warn(`top-tracks unavailable for "${name}":`, (err as Error).message);
      return [];
    });
    const artist: Artist = {
      slug,
      name: match.name,
      spotifyId: match.id,
      spotifyUrl: match.url,
      imageUrl: match.imageUrl,
      genres: match.genres,
      topTracks: tracks,
      lastResolvedAt: new Date().toISOString(),
    };
    await putArtist(artist);
    return artist;
  } catch (err) {
    console.warn(`Spotify resolve failed for "${name}":`, (err as Error).message);
    const blank = blankArtist(slug, name);
    await putArtist(blank);
    return blank;
  }
};

const artistQuerySchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
});

export const artistsRouter = Router();

artistsRouter.get<'/:slug', { slug: string }>(
  '/:slug',
  validateParams(slugParamsSchema),
  validateQuery(artistQuerySchema),
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const cached = await getArtistBySlug(slug);
    if (cached && isFresh(cached)) {
      res.set('Cache-Control', 'public, max-age=3600');
      res.json({ success: true, data: cached });
      return;
    }

    const name = (req.query.name as string | undefined) ?? cached?.name;
    if (!name) {
      throw new AppError(
        HTTP_STATUS.NOT_FOUND,
        'Artist not found — provide ?name= to resolve via Spotify',
      );
    }

    const fresh = await resolveAndCache(slug, name);
    res.set('Cache-Control', 'public, max-age=3600');
    res.json({ success: true, data: fresh });
  }),
);

artistsRouter.get<'/:slug/spotify', { slug: string }>(
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
