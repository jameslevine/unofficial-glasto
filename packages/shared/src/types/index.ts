import { z } from 'zod';

export const DayOfFestival = z.enum([
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
  'MONDAY',
]);
export type DayOfFestival = z.infer<typeof DayOfFestival>;

export const Performance = z.object({
  id: z.string(),
  year: z.number().int().min(1970).max(2100),
  title: z.string(),
  artistSlug: z.string().optional(),
  stage: z.string(),
  area: z.string(),
  day: DayOfFestival,
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  description: z.string().optional(),
  sourceUrl: z.string().url().optional(),
});
export type Performance = z.infer<typeof Performance>;

export const SpotifyTrack = z.object({
  id: z.string(),
  name: z.string(),
  previewUrl: z.string().url().nullable(),
  durationMs: z.number().int().nonnegative(),
});
export type SpotifyTrack = z.infer<typeof SpotifyTrack>;

export const Artist = z.object({
  slug: z.string(),
  name: z.string(),
  spotifyId: z.string().nullable(),
  spotifyUrl: z.string().url().nullable(),
  imageUrl: z.string().url().nullable(),
  genres: z.array(z.string()),
  topTracks: z.array(SpotifyTrack),
  bio: z.string().optional(),
  lastResolvedAt: z.string().datetime(),
});
export type Artist = z.infer<typeof Artist>;

export const Stage = z.object({
  slug: z.string(),
  name: z.string(),
  area: z.string(),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
  mapZone: z.string().optional(),
});
export type Stage = z.infer<typeof Stage>;

export const PoiCategory = z.enum([
  'AED',
  'AREA',
  'ATM',
  'BAR',
  'BUS_STOP',
  'CAMPING',
  'CAMPING_SHOP',
  'CAMPSITE_STEWARDS',
  'CHARITY_PARTNER',
  'DEAF_ZONE',
  'FOOD',
  'INDUCTION_LOOP_SYSTEM',
  'INFORMATION_POINT',
  'LANDMARK',
  'LOST_PROPERTY',
  'MARKET_CLUSTER_LABEL',
  'MEDICAL_CENTRE',
  'OFFICIAL_MERCHANDISE',
  'PARKING',
  'PHARMACY',
  'PROPERTY_LOCKUP',
  'SENSORY_CALM_SPACE',
  'SHOP',
  'SITE_ENTRANCES_AND_EXITS',
  'STAGE',
  'TOILET',
  'VIEWING_PLATFORM',
  'VODAFONE_CONNECT_AND_CHARGE',
  'VODAFONE_CONNECT_AND_CHARGE_SATELLITE',
  'WATER',
  'WELFARE',
  'WHEELCHAIR_ACCESSIBLE_TOILET',
  'WORTHY_REST',
]);
export type PoiCategory = z.infer<typeof PoiCategory>;

export const Poi = z.object({
  id: z.string(),
  year: z.number().int().min(1970).max(2100),
  category: PoiCategory,
  name: z.string(),
  description: z.string().nullable(),
  tags: z.array(z.string()),
  lat: z.number(),
  lon: z.number(),
});
export type Poi = z.infer<typeof Poi>;

export const ArtistSummary = z.object({
  slug: z.string(),
  genres: z.array(z.string()),
  previewUrl: z.string().url().nullable(),
});
export type ArtistSummary = z.infer<typeof ArtistSummary>;

export const Pin = z.object({
  id: z.string().min(1).max(64),
  userId: z.string(),
  label: z.string().min(1).max(80),
  emoji: z.string().max(8).optional(),
  lat: z.number(),
  lon: z.number(),
  updatedAt: z.string().datetime(),
  deleted: z.boolean().default(false),
});
export type Pin = z.infer<typeof Pin>;

export const Favourite = z.object({
  perfId: z.string(),
  userId: z.string(),
  updatedAt: z.string().datetime(),
  deleted: z.boolean().default(false),
});
export type Favourite = z.infer<typeof Favourite>;

export const ApiSuccess = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ success: z.literal(true), data });

export const ApiError = z.object({ success: z.literal(false), error: z.string() });
export type ApiError = z.infer<typeof ApiError>;
