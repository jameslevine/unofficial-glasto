import { Link } from 'react-router-dom';
import type { ScheduleItem } from '@glasto/shared';
import { useFavourites } from '../../store/favourites';
import { PlayPreviewButton } from '../audio/PlayPreviewButton';
import { formatTime } from '../lineup/utils';
import { AddToCalendarButton } from './AddToCalendarButton';

interface Props {
  item: ScheduleItem;
  gapMinutes: number | null;
  walkMinutes: number | null;
  fromStage: string | null;
  previewUrl?: string | null;
}

export const ScheduleItemRow = ({
  item,
  gapMinutes,
  walkMinutes,
  fromStage,
  previewUrl,
}: Props) => {
  const { performance, conflictGroupId, overlapsWith } = item;
  const primaryByGroup = useFavourites((s) => s.primaryByGroup);
  const setPrimary = useFavourites((s) => s.setPrimary);
  const toggle = useFavourites((s) => s.toggle);

  const inConflict = conflictGroupId !== null;
  const primaryId = inConflict ? primaryByGroup[conflictGroupId] : undefined;
  const isPrimary = inConflict && primaryId === performance.id;
  const isSecondary = inConflict && !!primaryId && primaryId !== performance.id;

  return (
    <li className="space-y-2">
      {gapMinutes !== null && gapMinutes > 0 && (
        <p className="pl-3 text-xs text-muted">
          ↳ {gapMinutes} min gap
          {walkMinutes !== null && walkMinutes > 0 && fromStage
            ? ` · ~${walkMinutes} min walk from ${fromStage}`
            : ''}
        </p>
      )}
      <article
        className={`flex h-full flex-col justify-between gap-3 rounded-lg border bg-surface p-3 transition hover:bg-surface-2 ${
          inConflict ? 'border-l-4 border-l-accent border-border' : 'border-border'
        } ${isSecondary ? 'opacity-60' : ''}`}
      >
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            {performance.artistSlug ? (
              <Link
                to={`/artists/${performance.artistSlug}?name=${encodeURIComponent(performance.title)}`}
                className="font-semibold leading-tight hover:text-brand hover:underline"
              >
                {performance.title}
              </Link>
            ) : (
              <h3 className="font-semibold leading-tight">{performance.title}</h3>
            )}
            <button
              type="button"
              onClick={() => toggle(performance.id)}
              aria-label="Remove favourite"
              aria-pressed={true}
              className="shrink-0 rounded-full px-2 py-1 text-base leading-none text-brand transition"
            >
              ★
            </button>
          </div>
          <p className="text-xs uppercase tracking-wide text-muted">
            {performance.area} · {performance.stage}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted">
              <time dateTime={performance.startsAt}>{formatTime(performance.startsAt)}</time>
              {' – '}
              <time dateTime={performance.endsAt}>{formatTime(performance.endsAt)}</time>
            </p>
            <PlayPreviewButton id={performance.id} previewUrl={previewUrl} />
            <AddToCalendarButton performance={performance} />
          </div>
          {inConflict && (
            <div
              className="flex items-center gap-2"
              role="status"
              aria-label={`Clashes with ${overlapsWith.length} other favourite${overlapsWith.length === 1 ? '' : 's'}`}
            >
              {isPrimary ? (
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                  Primary
                </span>
              ) : isSecondary ? (
                <>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
                    Secondary
                  </span>
                  <button
                    type="button"
                    onClick={() => setPrimary(conflictGroupId, performance.id)}
                    className="rounded-full border border-accent px-2 py-0.5 text-xs font-medium text-accent transition hover:bg-accent hover:text-bg"
                  >
                    Make primary
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setPrimary(conflictGroupId, performance.id)}
                  className="rounded-full border border-accent px-2 py-0.5 text-xs font-medium text-accent transition hover:bg-accent hover:text-bg"
                >
                  Make primary
                </button>
              )}
            </div>
          )}
        </div>
      </article>
    </li>
  );
};
