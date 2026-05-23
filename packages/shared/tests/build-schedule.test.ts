import { describe, expect, it } from 'vitest';
import type { Performance } from '../src/types/index.js';
import { buildSchedule, detectConflicts } from '../src/schedule/build-schedule.js';
import type { ScheduleItem } from '../src/schedule/build-schedule.js';

const perf = (
  overrides: Partial<Performance> & Pick<Performance, 'id' | 'startsAt' | 'endsAt'>,
): Performance => ({
  year: 2024,
  title: overrides.id,
  stage: 'Pyramid',
  area: 'Music',
  day: 'FRIDAY',
  description: undefined,
  artistSlug: undefined,
  sourceUrl: undefined,
  ...overrides,
});

const item = (
  id: string,
  startsAt: string,
  endsAt: string,
  day: Performance['day'] = 'FRIDAY',
): ScheduleItem => ({
  performance: perf({ id, startsAt, endsAt, day }),
  startMs: Date.parse(startsAt),
  endMs: Date.parse(endsAt),
  conflictGroupId: null,
  overlapsWith: [],
});

describe('buildSchedule', () => {
  it('returns empty for no favourites', () => {
    expect(buildSchedule([], {})).toEqual([]);
  });

  it('returns single day with one item', () => {
    const p = perf({
      id: 'a',
      startsAt: '2024-06-28T20:00:00+01:00',
      endsAt: '2024-06-28T21:30:00+01:00',
    });
    const days = buildSchedule([p], { a: true });
    expect(days).toHaveLength(1);
    expect(days[0]?.day).toBe('FRIDAY');
    expect(days[0]?.items[0]?.performance.id).toBe('a');
  });

  it('orders by Date.parse, not string compare, across timezones', () => {
    // Two events: A is technically earlier in UTC but lexicographically later if compared as strings.
    const a = perf({
      id: 'a',
      startsAt: '2024-06-28T20:00:00+02:00', // 18:00 UTC
      endsAt: '2024-06-28T21:00:00+02:00',
    });
    const b = perf({
      id: 'b',
      startsAt: '2024-06-28T19:30:00+01:00', // 18:30 UTC
      endsAt: '2024-06-28T20:30:00+01:00',
    });
    const days = buildSchedule([b, a], { a: true, b: true });
    expect(days[0]?.items.map((i) => i.performance.id)).toEqual(['a', 'b']);
  });

  it('groups across multiple days in WED→MON order', () => {
    const wed = perf({
      id: 'w',
      day: 'WEDNESDAY',
      startsAt: '2024-06-26T18:00:00+01:00',
      endsAt: '2024-06-26T19:00:00+01:00',
    });
    const sat = perf({
      id: 's',
      day: 'SATURDAY',
      startsAt: '2024-06-29T20:00:00+01:00',
      endsAt: '2024-06-29T21:00:00+01:00',
    });
    const days = buildSchedule([sat, wed], { w: true, s: true });
    expect(days.map((d) => d.day)).toEqual(['WEDNESDAY', 'SATURDAY']);
  });

  it('skips non-favourited performances', () => {
    const a = perf({
      id: 'a',
      startsAt: '2024-06-28T20:00:00+01:00',
      endsAt: '2024-06-28T21:00:00+01:00',
    });
    const b = perf({
      id: 'b',
      startsAt: '2024-06-28T22:00:00+01:00',
      endsAt: '2024-06-28T23:00:00+01:00',
    });
    const days = buildSchedule([a, b], { a: true });
    expect(days[0]?.items).toHaveLength(1);
    expect(days[0]?.items[0]?.performance.id).toBe('a');
  });

  it('handles cross-midnight performance', () => {
    const late = perf({
      id: 'late',
      startsAt: '2024-06-28T23:30:00+01:00',
      endsAt: '2024-06-29T01:00:00+01:00',
    });
    const days = buildSchedule([late], { late: true });
    expect(days[0]?.items[0]?.endMs).toBeGreaterThan(days[0]?.items[0]?.startMs ?? 0);
  });
});

describe('detectConflicts', () => {
  it('flags two overlapping items in same group', () => {
    const items = detectConflicts([
      item('a', '2024-06-28T20:00:00+01:00', '2024-06-28T21:00:00+01:00'),
      item('b', '2024-06-28T20:30:00+01:00', '2024-06-28T21:30:00+01:00'),
    ]);
    expect(items[0]?.conflictGroupId).not.toBeNull();
    expect(items[1]?.conflictGroupId).toBe(items[0]?.conflictGroupId);
    expect(items[0]?.overlapsWith).toEqual(['b']);
    expect(items[1]?.overlapsWith).toEqual(['a']);
  });

  it('does NOT flag touching boundaries (a.endsAt === b.startsAt) as a conflict', () => {
    const items = detectConflicts([
      item('a', '2024-06-28T20:00:00+01:00', '2024-06-28T21:00:00+01:00'),
      item('b', '2024-06-28T21:00:00+01:00', '2024-06-28T22:00:00+01:00'),
    ]);
    expect(items[0]?.conflictGroupId).toBeNull();
    expect(items[1]?.conflictGroupId).toBeNull();
  });

  it('groups three-way chain via transitive overlap', () => {
    const items = detectConflicts([
      item('a', '2024-06-28T20:00:00+01:00', '2024-06-28T21:00:00+01:00'),
      item('b', '2024-06-28T20:45:00+01:00', '2024-06-28T21:45:00+01:00'),
      item('c', '2024-06-28T21:30:00+01:00', '2024-06-28T22:30:00+01:00'),
    ]);
    const groups = new Set(items.map((i) => i.conflictGroupId));
    expect(groups.size).toBe(1);
    expect([...groups][0]).not.toBeNull();
    expect(items.find((i) => i.performance.id === 'a')?.overlapsWith).toEqual(['b']);
    expect(items.find((i) => i.performance.id === 'c')?.overlapsWith).toEqual(['b']);
  });

  it('keeps non-overlapping items free of group id', () => {
    const items = detectConflicts([
      item('a', '2024-06-28T18:00:00+01:00', '2024-06-28T19:00:00+01:00'),
      item('b', '2024-06-28T22:00:00+01:00', '2024-06-28T23:00:00+01:00'),
    ]);
    expect(items[0]?.conflictGroupId).toBeNull();
    expect(items[1]?.conflictGroupId).toBeNull();
  });

  it('returns the same array unchanged when fewer than 2 items', () => {
    const single = [item('a', '2024-06-28T20:00:00+01:00', '2024-06-28T21:00:00+01:00')];
    expect(detectConflicts(single)).toBe(single);
  });

  it('detects cross-midnight overlap', () => {
    const items = detectConflicts([
      item('a', '2024-06-28T23:30:00+01:00', '2024-06-29T01:00:00+01:00'),
      item('b', '2024-06-29T00:30:00+01:00', '2024-06-29T01:30:00+01:00'),
    ]);
    expect(items[0]?.conflictGroupId).not.toBeNull();
    expect(items[0]?.conflictGroupId).toBe(items[1]?.conflictGroupId);
  });
});
