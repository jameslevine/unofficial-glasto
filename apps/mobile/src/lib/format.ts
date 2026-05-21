import type { DayOfFestival, Performance } from '@glasto/shared';

const DAY_ORDER: DayOfFestival[] = [
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
  'MONDAY',
];

const DAY_LABELS: Record<DayOfFestival, string> = {
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
  MONDAY: 'Monday',
};

export const formatDay = (day: string) => DAY_LABELS[day as DayOfFestival] ?? day;

export const formatTime = (iso: string) => {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

export const groupByDay = (performances: Performance[]): [DayOfFestival, Performance[]][] => {
  const map = new Map<DayOfFestival, Performance[]>();
  for (const p of performances) {
    const list = map.get(p.day);
    if (list) list.push(p);
    else map.set(p.day, [p]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
  return DAY_ORDER.filter((d) => map.has(d)).map((d) => [d, map.get(d) as Performance[]]);
};

export { DAY_ORDER };
