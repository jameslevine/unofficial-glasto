import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { artistSummaryQueryKey, lineupQueryKey, useStages } from '@glasto/shared';
import type { ArtistSummary, Performance } from '@glasto/shared';
import { api } from '../../lib/api';
import { useFavourites } from '../../store/favourites';
import { ExportButton } from '../schedule/ExportButton';
import { NowNextBanner } from '../schedule/NowNextBanner';
import { ScheduleTimeline } from '../schedule/ScheduleTimeline';

const YEARS = [2025, 2024, 2023, 2022] as const;

export const FavouritesPage = () => {
  const ids = useFavourites((s) => s.ids);
  const clear = useFavourites((s) => s.clear);

  const queries = useQueries({
    queries: YEARS.map((year) => ({
      queryKey: lineupQueryKey(year),
      queryFn: () => api.getLineup(year),
      staleTime: 1000 * 60 * 60,
    })),
  });

  const summaryQueries = useQueries({
    queries: YEARS.map((year) => ({
      queryKey: artistSummaryQueryKey(year),
      queryFn: () => api.getArtistSummary(year),
      staleTime: 1000 * 60 * 60 * 24,
    })),
  });

  const favourites = useMemo(() => {
    const all: Performance[] = [];
    for (const q of queries) {
      if (q.data) all.push(...q.data);
    }
    return all.filter((p) => ids[p.id]);
  }, [queries, ids]);

  const slugPreview = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const q of summaryQueries) {
      const data = q.data as ArtistSummary[] | undefined;
      if (!data) continue;
      for (const a of data) map.set(a.slug, a.previewUrl);
    }
    return map;
  }, [summaryQueries]);

  const isLoading = queries.some((q) => q.isPending);
  const favCount = Object.keys(ids).length;
  const { data: stages } = useStages(api);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">My schedule</h1>
          <p className="text-sm text-muted">{favCount} saved · stored locally on this device.</p>
        </div>
        {favCount > 0 && (
          <div className="flex items-center gap-2">
            <ExportButton performances={favourites} />
            <button type="button" className="btn" onClick={clear}>
              Clear all
            </button>
          </div>
        )}
      </header>

      {favCount === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted">
          Tap ☆ on any performance to save it here.
        </p>
      ) : isLoading && favourites.length === 0 ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <>
          <NowNextBanner performances={favourites} />
          <ScheduleTimeline performances={favourites} stages={stages} slugPreview={slugPreview} />
        </>
      )}
    </div>
  );
};
