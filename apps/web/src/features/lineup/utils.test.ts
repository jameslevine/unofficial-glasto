import { describe, it, expect } from 'vitest';
import { groupByDay, formatDay } from './utils';
import type { Performance } from '@glasto/shared';

const mk = (id: string, day: Performance['day'], startsAt: string): Performance => ({
  id,
  year: 2024,
  title: id,
  stage: 'Pyramid',
  area: 'MAIN STAGES',
  day,
  startsAt,
  endsAt: startsAt,
});

describe('groupByDay', () => {
  it('groups in canonical festival order and sorts by start time', () => {
    const grouped = groupByDay([
      mk('a', 'FRIDAY', '2024-06-28T20:00:00+01:00'),
      mk('b', 'WEDNESDAY', '2024-06-26T18:00:00+01:00'),
      mk('c', 'FRIDAY', '2024-06-28T15:00:00+01:00'),
    ]);

    expect(grouped.map(([day]) => day)).toEqual(['WEDNESDAY', 'FRIDAY']);
    expect(grouped[1]?.[1].map((p) => p.id)).toEqual(['c', 'a']);
  });
});

describe('formatDay', () => {
  it('renders friendly labels and falls back to the input', () => {
    expect(formatDay('SATURDAY')).toBe('Saturday');
    expect(formatDay('UNKNOWN')).toBe('UNKNOWN');
  });
});
