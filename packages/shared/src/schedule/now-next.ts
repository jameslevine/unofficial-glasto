import type { DaySchedule, ScheduleItem } from './build-schedule.js';

export interface NowNext {
  now: ScheduleItem | null;
  next: ScheduleItem | null;
}

const flatten = (days: DaySchedule[]): ScheduleItem[] => days.flatMap((d) => d.items);

const pickActive = (
  candidates: ScheduleItem[],
  primaryByGroup: Record<string, string> | undefined,
): ScheduleItem | null => {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0] ?? null;
  if (primaryByGroup) {
    for (const item of candidates) {
      const groupId = item.conflictGroupId;
      if (groupId && primaryByGroup[groupId] === item.performance.id) return item;
    }
  }
  return candidates[0] ?? null;
};

export const getNowNext = (
  days: DaySchedule[],
  nowMs: number,
  primaryByGroup?: Record<string, string>,
): NowNext => {
  const items = flatten(days).sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  const active = items.filter((i) => i.startMs <= nowMs && nowMs < i.endMs);
  const upcoming = items.filter((i) => i.startMs > nowMs);
  return {
    now: pickActive(active, primaryByGroup),
    next: upcoming[0] ?? null,
  };
};
