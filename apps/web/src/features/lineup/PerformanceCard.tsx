import type { Performance } from '@glasto/shared';
import { useFavourites } from '../../store/favourites';
import { formatTime } from './utils';

export const PerformanceCard = ({ performance }: { performance: Performance }) => {
  const isFav = useFavourites((s) => Boolean(s.ids[performance.id]));
  const toggle = useFavourites((s) => s.toggle);

  return (
    <article className="flex h-full flex-col justify-between gap-3 rounded-lg border border-border bg-surface p-3 transition hover:bg-surface-2">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{performance.title}</h3>
          <button
            type="button"
            onClick={() => toggle(performance.id)}
            aria-pressed={isFav}
            aria-label={isFav ? 'Remove favourite' : 'Add favourite'}
            className={`shrink-0 rounded-full px-2 py-1 text-base leading-none transition ${
              isFav ? 'text-brand' : 'text-muted hover:text-fg'
            }`}
          >
            {isFav ? '★' : '☆'}
          </button>
        </div>
        <p className="text-xs uppercase tracking-wide text-muted">
          {performance.area} · {performance.stage}
        </p>
      </div>
      <p className="text-sm text-muted">
        <time dateTime={performance.startsAt}>{formatTime(performance.startsAt)}</time>
        {' – '}
        <time dateTime={performance.endsAt}>{formatTime(performance.endsAt)}</time>
      </p>
    </article>
  );
};
