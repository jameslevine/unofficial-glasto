import { z } from 'zod';
import {
  Artist,
  ArtistSummary,
  ApiError,
  Favourite,
  Performance,
  Poi,
  Stage,
} from './types/index.js';

export interface ApiClientOptions {
  baseUrl: string;
  getAuthToken?: () => Promise<string | null> | string | null;
}

export class ApiError$ extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const createApiClient = (opts: ApiClientOptions) => {
  const request = async <T extends z.ZodTypeAny>(
    path: string,
    schema: T,
    init: RequestInit = {},
  ): Promise<z.infer<T>> => {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');

    if (opts.getAuthToken) {
      const token = await opts.getAuthToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(`${opts.baseUrl}${path}`, { ...init, headers });
    const json = await res.json();

    if (!res.ok || json?.success === false) {
      const parsed = ApiError.safeParse(json);
      const message = parsed.success ? parsed.data.error : `Request failed (${res.status})`;
      throw new ApiError$(res.status, message);
    }

    return schema.parse(json.data);
  };

  return {
    getLineup: (year: number) => request(`/lineup/${year}`, z.array(Performance)),
    getStages: () => request('/stages', z.array(Stage)),
    getArtist: (slug: string, name?: string) => {
      const qs = name ? `?name=${encodeURIComponent(name)}` : '';
      return request(`/artists/${slug}${qs}`, Artist);
    },
    getArtistSummary: (year: number) =>
      request(`/artists/summary?year=${year}`, z.array(ArtistSummary)),
    getPois: (year: number) => request(`/poi?year=${year}`, z.array(Poi)),
    listFavourites: () => request('/me/favourites', z.array(Favourite)),
    syncFavourites: (favourites: Array<{ perfId: string; updatedAt: string; deleted?: boolean }>) =>
      request('/me/sync', z.array(Favourite), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favourites }),
      }),
  };
};

export type ApiClient = ReturnType<typeof createApiClient>;
