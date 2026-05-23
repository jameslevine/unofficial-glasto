import { describe, expect, it } from 'vitest';
import type { Performance } from '../src/types/index.js';
import { buildSchedule } from '../src/schedule/build-schedule.js';
import { getNowNext } from '../src/schedule/now-next.js';

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

const ms = (iso: string) => Date.parse(iso);

describe('getNowNext', () => {
  const a = perf({
    id: 'a',
    startsAt: '2024-06-28T18:00:00+01:00',
    endsAt: '2024-06-28T19:00:00+01:00',
  });
  const b = perf({
    id: 'b',
    startsAt: '2024-06-28T20:00:00+01:00',
    endsAt: '2024-06-28T21:30:00+01:00',
  });
  const c = perf({
    id: 'c',
    day: 'SATURDAY',
    startsAt: '2024-06-29T22:15:00+01:00',
    endsAt: '2024-06-30T00:15:00+01:00',
  });
  const ids = { a: true, b: true, c: true } as const;
  const days = buildSchedule([a, b, c], ids);

  it('returns null/null before festival starts', () => {
    expect(getNowNext(days, ms('2024-06-27T12:00:00+01:00'))).toEqual({
      now: null,
      next: expect.objectContaining({ performance: expect.objectContaining({ id: 'a' }) }),
    });
  });

  it('returns active set as now and next upcoming', () => {
    const r = getNowNext(days, ms('2024-06-28T18:30:00+01:00'));
    expect(r.now?.performance.id).toBe('a');
    expect(r.next?.performance.id).toBe('b');
  });

  it('returns null now between sets, next upcoming', () => {
    const r = getNowNext(days, ms('2024-06-28T19:30:00+01:00'));
    expect(r.now).toBeNull();
    expect(r.next?.performance.id).toBe('b');
  });

  it('handles cross-midnight active set', () => {
    const r = getNowNext(days, ms('2024-06-29T23:30:00+01:00'));
    expect(r.now?.performance.id).toBe('c');
    expect(r.next).toBeNull();
  });

  it('returns null/null after festival ends', () => {
    const r = getNowNext(days, ms('2024-07-01T12:00:00+01:00'));
    expect(r.now).toBeNull();
    expect(r.next).toBeNull();
  });

  it('end-time boundary is exclusive (touching does not count as now)', () => {
    const r = getNowNext(days, ms('2024-06-28T19:00:00+01:00'));
    expect(r.now).toBeNull();
    expect(r.next?.performance.id).toBe('b');
  });

  it('respects primaryByGroup when overlapping items are active', () => {
    const x = perf({
      id: 'x',
      startsAt: '2024-06-28T20:00:00+01:00',
      endsAt: '2024-06-28T21:00:00+01:00',
    });
    const y = perf({
      id: 'y',
      startsAt: '2024-06-28T20:15:00+01:00',
      endsAt: '2024-06-28T21:15:00+01:00',
    });
    const d = buildSchedule([x, y], { x: true, y: true });
    const groupId = d[0]?.items[0]?.conflictGroupId;
    expect(groupId).toBeTruthy();
    const r = getNowNext(d, ms('2024-06-28T20:30:00+01:00'), {
      [groupId as string]: 'y',
    });
    expect(r.now?.performance.id).toBe('y');
  });
});
