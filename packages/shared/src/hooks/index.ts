import { useQuery } from '@tanstack/react-query';
import type { ApiClient } from '../api-client.js';

export const lineupQueryKey = (year: number) => ['lineup', year] as const;
export const stagesQueryKey = () => ['stages'] as const;
export const artistQueryKey = (slug: string) => ['artist', slug] as const;
export const artistSummaryQueryKey = (year: number) => ['artist-summary', year] as const;
export const poisQueryKey = (year: number) => ['pois', year] as const;

export const useLineup = (api: ApiClient, year: number) =>
  useQuery({
    queryKey: lineupQueryKey(year),
    queryFn: () => api.getLineup(year),
    staleTime: 1000 * 60 * 60,
  });

export const useStages = (api: ApiClient) =>
  useQuery({
    queryKey: stagesQueryKey(),
    queryFn: () => api.getStages(),
    staleTime: 1000 * 60 * 60 * 24,
  });

export const useArtist = (api: ApiClient, slug: string | undefined, name?: string) =>
  useQuery({
    enabled: !!slug,
    queryKey: artistQueryKey(slug ?? ''),
    queryFn: () => api.getArtist(slug as string, name),
    staleTime: 1000 * 60 * 60,
  });

export const useArtistSummary = (api: ApiClient, year: number) =>
  useQuery({
    queryKey: artistSummaryQueryKey(year),
    queryFn: () => api.getArtistSummary(year),
    staleTime: 1000 * 60 * 60 * 24,
  });

export const usePois = (api: ApiClient, year: number) =>
  useQuery({
    queryKey: poisQueryKey(year),
    queryFn: () => api.getPois(year),
    staleTime: 1000 * 60 * 60 * 24,
  });
