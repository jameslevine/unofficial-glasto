import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLineup } from '@glasto/shared';
import type { DayOfFestival, Performance } from '@glasto/shared';
import { api } from '../../lib/api';
import { PerformanceCard } from './PerformanceCard';
import { FilterBar } from './FilterBar';
import { groupByDay, formatDay } from './utils';

const ALL = '__ALL__';

export const LineupPage = () => {
  const { year: yearParam } = useParams<{ year: string }>();
  const year = Number(yearParam);
  const query = useLineup(api, year);

  const [search, setSearch] = useState('');
  const [day, setDay] = useState<DayOfFestival | typeof ALL>(ALL);
  const [area, setArea] = useState<string>(ALL);

  const data = query.data ?? [];

  const areas = useMemo(() => {
    const set = new Set<string>();
    for (const p of data) set.add(p.area);
    return [...set].sort();
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((p) => {
      if (day !== ALL && p.day !== day) return false;
      if (area !== ALL && p.area !== area) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.stage.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [data, search, day, area]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  if (query.isPending) {
    return <Loading message={`Loading ${year} lineup…`} />;
  }
  if (query.isError) {
    return (
      <div className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm">
        <p className="font-semibold">Failed to load lineup.</p>
        <p className="mt-1 text-muted">{(query.error as Error).message}</p>
        <button className="btn mt-3" onClick={() => query.refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Glastonbury {year}</h1>
        <p className="text-sm text-muted">
          {data.length.toLocaleString()} performances across {areas.length} areas.
        </p>
      </header>

      <FilterBar
        search={search}
        onSearch={setSearch}
        day={day}
        onDay={setDay}
        area={area}
        onArea={setArea}
        areas={areas}
        allValue={ALL}
      />

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted">
          Nothing matches those filters.
        </p>
      ) : (
        <div className="space-y-8">
          {grouped.map(([dayKey, items]) => (
            <section key={dayKey} aria-labelledby={`day-${dayKey}`} className="space-y-3">
              <h2 id={`day-${dayKey}`} className="font-display text-xl font-semibold">
                {formatDay(dayKey)}{' '}
                <span className="text-sm font-normal text-muted">({items.length})</span>
              </h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((p) => (
                  <li key={p.id}>
                    <PerformanceCard performance={p} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

const Loading = ({ message }: { message: string }) => (
  <div className="space-y-4 py-12 text-center">
    <p className="text-muted">{message}</p>
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="h-24 animate-pulse rounded-lg border border-border bg-surface"
          aria-hidden
        />
      ))}
    </ul>
  </div>
);

export type { Performance };
