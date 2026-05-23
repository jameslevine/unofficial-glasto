import { useEffect, useMemo, useState } from 'react';
import { buildSchedule, getNowNext } from '@glasto/shared';
import type { Performance } from '@glasto/shared';
import { useFavourites } from '../../store/favourites';
import { formatTime } from '../lineup/utils';

interface Props {
  performances: Performance[];
}

const TICK_MS = 60_000;

export const NowNextBanner = ({ performances }: Props) => {
  const ids = useFavourites((s) => s.ids);
  const primaryByGroup = useFavourites((s) => s.primaryByGroup);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const days = useMemo(() => buildSchedule(performances, ids), [performances, ids]);
  const { now, next } = useMemo(
    () => getNowNext(days, nowMs, primaryByGroup),
    [days, nowMs, primaryByGroup],
  );

  if (!now && !next) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="grid gap-3 rounded-lg border border-border bg-surface2 p-4 sm:grid-cols-2"
    >
      <Card label="Now" item={now} accent />
      <Card label="Up next" item={next} />
    </aside>
  );
};

const Card = ({
  label,
  item,
  accent = false,
}: {
  label: string;
  item: { performance: Performance; startMs: number; endMs: number } | null;
  accent?: boolean;
}) => {
  if (!item) {
    return (
      <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted">
        <span className="block text-[11px] uppercase tracking-wide">{label}</span>
        <span>Nothing scheduled</span>
      </div>
    );
  }
  const { performance } = item;
  return (
    <div
      className={`rounded-md border p-3 ${accent ? 'border-brand bg-surface' : 'border-border bg-surface'}`}
    >
      <span
        className={`block text-[11px] uppercase tracking-wide ${accent ? 'text-brand' : 'text-muted'}`}
      >
        {label}
      </span>
      <span className="block font-display text-base font-semibold">{performance.title}</span>
      <span className="block text-xs text-muted">
        {formatTime(performance.startsAt)}–{formatTime(performance.endsAt)} · {performance.stage}
      </span>
    </div>
  );
};
