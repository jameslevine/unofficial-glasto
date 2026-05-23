import { Router } from 'express';
import Joi from 'joi';
import type { Artist, ArtistSummary } from '@glasto/shared';
import { pickPreviewTrack } from '@glasto/shared';
import { getArtistBySlug, getArtistsBySlugs, putArtist } from '../adapters/dynamodb-artists.js';
import { getLineupByYear } from '../adapters/dynamodb-lineup.js';
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

const summaryQuerySchema = Joi.object({
  year: Joi.number().integer().min(1970).max(2100).required(),
});

export const artistsRouter = Router();

artistsRouter.get(
  '/summary',
  validateQuery(summaryQuerySchema),
  asyncHandler(async (req, res) => {
    const year = Number(req.query.year);
    const lineup = await getLineupByYear(year);
    const slugs = Array.from(
      new Set(lineup.map((p) => p.artistSlug).filter((s): s is string => !!s)),
    );
    const artists = await getArtistsBySlugs(slugs);
    const data: ArtistSummary[] = artists.map((a) => ({
      slug: a.slug,
      genres: a.genres,
      previewUrl: pickPreviewTrack(a)?.previewUrl ?? null,
    }));
    res.set('Cache-Control', 'public, max-age=3600');
    res.json({ success: true, data });
  }),
);

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
