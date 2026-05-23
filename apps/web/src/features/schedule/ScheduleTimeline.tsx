import { useMemo } from 'react';
import { buildSchedule, walkingMinutes } from '@glasto/shared';
import type { Performance, Stage } from '@glasto/shared';
import { useFavourites } from '../../store/favourites';
import { formatDay } from '../lineup/utils';
import { ScheduleItemRow } from './ScheduleItemRow';

interface Props {
  performances: Performance[];
  stages: Stage[] | undefined;
  slugPreview?: Map<string, string | null>;
}

export const ScheduleTimeline = ({ performances, stages, slugPreview }: Props) => {
  const ids = useFavourites((s) => s.ids);

  const days = useMemo(() => buildSchedule(performances, ids), [performances, ids]);

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

  if (days.length === 0) return null;

  return (
    <div className="space-y-8">
      {days.map(({ day, items }) => (
        <section key={day} className="space-y-3">
          <h2 className="font-display text-xl font-semibold">{formatDay(day)}</h2>
          <ul className="space-y-3">
            {items.map((item, i) => {
              const prev = items[i - 1];
              const gapMinutes = prev
                ? Math.max(0, Math.round((item.startMs - prev.endMs) / 60000))
                : null;
              const fromStage = prev ? findStage(prev.performance) : undefined;
              const toStage = findStage(item.performance);
              const walkMinutes =
                prev && fromStage?.lat != null && toStage?.lat != null
                  ? walkingMinutes(
                      { lat: fromStage.lat, lon: fromStage.lon as number },
                      { lat: toStage.lat, lon: toStage.lon as number },
                    )
                  : null;
              return (
                <ScheduleItemRow
                  key={item.performance.id}
                  item={item}
                  gapMinutes={gapMinutes}
                  walkMinutes={walkMinutes}
                  fromStage={prev?.performance.stage ?? null}
                  previewUrl={
                    item.performance.artistSlug
                      ? (slugPreview?.get(item.performance.artistSlug) ?? null)
                      : null
                  }
                />
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
};
