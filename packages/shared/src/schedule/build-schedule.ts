import type { DayOfFestival, Performance } from '../types/index.js';

export interface ScheduleItem {
  performance: Performance;
  startMs: number;
  endMs: number;
  conflictGroupId: string | null;
  overlapsWith: string[];
}

export interface DaySchedule {
  day: DayOfFestival;
  items: ScheduleItem[];
}

const DAY_ORDER: DayOfFestival[] = [
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
  'MONDAY',
];

export const detectConflicts = (items: ScheduleItem[]): ScheduleItem[] => {
  if (items.length < 2) return items;

  const sorted = [...items].sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  const overlaps = new Map<string, Set<string>>();
  for (const item of sorted) overlaps.set(item.performance.id, new Set());

  // Sweep-line: maintain a list of currently-active items.
  // When a new item starts, it overlaps with every active item whose end > its start
  // (touching boundaries — end == start — do NOT count).
  const active: ScheduleItem[] = [];
  for (const item of sorted) {
    for (let i = active.length - 1; i >= 0; i -= 1) {
      const a = active[i];
      if (a === undefined) continue;
      if (a.endMs <= item.startMs) {
        active.splice(i, 1);
      } else {
        overlaps.get(item.performance.id)?.add(a.performance.id);
        overlaps.get(a.performance.id)?.add(item.performance.id);
      }
    }
    active.push(item);
  }

  // Connected components: items linked by overlap belong to the same conflict group.
  const groupOf = new Map<string, string>();
  const visit = (startId: string, groupId: string) => {
    const stack = [startId];
    while (stack.length > 0) {
      const id = stack.pop();
      if (id === undefined || groupOf.has(id)) continue;
      groupOf.set(id, groupId);
      const neighbours = overlaps.get(id);
      if (neighbours) for (const n of neighbours) stack.push(n);
    }
  };
  for (const item of sorted) {
    const id = item.performance.id;
    if (groupOf.has(id)) continue;
    if ((overlaps.get(id)?.size ?? 0) === 0) continue;
    visit(id, `cg-${id}`);
  }

  return items.map((item) => {
    const id = item.performance.id;
    const group = groupOf.get(id) ?? null;
    const peers = overlaps.get(id);
    return {
      ...item,
      conflictGroupId: group,
      overlapsWith: peers ? Array.from(peers) : [],
    };
  });
};

export const buildSchedule = (
  performances: Performance[],
  favIds: Record<string, true | undefined> | Set<string>,
): DaySchedule[] => {
  const has = (id: string) => (favIds instanceof Set ? favIds.has(id) : Boolean(favIds[id]));

  const byDay = new Map<DayOfFestival, ScheduleItem[]>();
  for (const performance of performances) {
    if (!has(performance.id)) continue;
    const startMs = Date.parse(performance.startsAt);
    const endMs = Date.parse(performance.endsAt);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) continue;
    const item: ScheduleItem = {
      performance,
      startMs,
      endMs,
      conflictGroupId: null,
      overlapsWith: [],
    };
    const list = byDay.get(performance.day);
    if (list) list.push(item);
    else byDay.set(performance.day, [item]);
  }

  const days: DaySchedule[] = [];
  for (const day of DAY_ORDER) {
    const items = byDay.get(day);
    if (!items) continue;
    const sorted = [...items].sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
    const tagged = detectConflicts(sorted);
    days.push({ day, items: tagged });
  }
  return days;
};
