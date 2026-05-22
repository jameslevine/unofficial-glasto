import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { lineupQueryKey, useStages, walkingMinutes } from '@glasto/shared';
import type { Performance, Stage } from '@glasto/shared';
import { api } from '../../lib/api';
import { useFavourites } from '../../store/favourites';
import { PerformanceCard } from './PerformanceCard';
import { groupByDay, formatDay } from './utils';

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

  const favourites = useMemo(() => {
    const all: Performance[] = [];
    for (const q of queries) {
      if (q.data) all.push(...q.data);
    }
    return all.filter((p) => ids[p.id]);
  }, [queries, ids]);

  const grouped = useMemo(() => groupByDay(favourites), [favourites]);
  const isLoading = queries.some((q) => q.isPending);
  const favCount = Object.keys(ids).length;
  const { data: stages } = useStages(api);
  const stageBySlug = useMemo(() => {
    const map = new Map<string, Stage>();
    stages?.forEach((s) => {
      const norm = s.name.toLowerCase().replace(/\s+/g, '-');
      map.set(s.slug, s);
      map.set(norm, s);
    });
    return map;
  }, [stages]);
  const findStage = (perf: Performance): Stage | undefined => {
    const norm = perf.stage.toLowerCase().replace(/\s+/g, '-');
    return stageBySlug.get(norm);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Your favourites</h1>
          <p className="text-sm text-muted">{favCount} saved · stored locally on this device.</p>
        </div>
        {favCount > 0 && (
          <button type="button" className="btn" onClick={clear}>
            Clear all
          </button>
        )}
      </header>

      {favCount === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted">
          Tap ☆ on any performance to save it here.
        </p>
      ) : isLoading && favourites.length === 0 ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <div className="space-y-8">
          {grouped.map(([day, items]) => (
            <section key={day} className="space-y-3">
              <h2 className="font-display text-xl font-semibold">{formatDay(day)}</h2>
              <ul className="space-y-3">
                {items.map((p, i) => {
                  const prev = items[i - 1];
                  const fromStage = prev ? findStage(prev) : undefined;
                  const toStage = findStage(p);
                  const minutes =
                    prev && fromStage?.lat != null && toStage?.lat != null
                      ? walkingMinutes(
                          { lat: fromStage.lat, lon: fromStage.lon as number },
                          { lat: toStage.lat, lon: toStage.lon as number },
                        )
                      : null;
                  return (
                    <li key={p.id} className="space-y-2">
                      {minutes !== null && minutes > 0 && (
                        <p className="pl-3 text-xs text-muted">
                          ↳ ~{minutes} min walk from {prev?.stage}
                        </p>
                      )}
                      <PerformanceCard performance={p} />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
