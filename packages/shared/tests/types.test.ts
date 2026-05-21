import { describe, expect, it } from 'vitest';
import { Performance } from '../src/types/index.js';

describe('Performance schema', () => {
  it('parses a valid performance', () => {
    const result = Performance.parse({
      id: '2024-pyramid-coldplay-sat-2200',
      year: 2024,
      title: 'Coldplay',
      stage: 'Pyramid Stage',
      area: 'Music',
      day: 'SATURDAY',
      startsAt: '2024-06-29T22:00:00+01:00',
      endsAt: '2024-06-29T23:30:00+01:00',
    });
    expect(result.title).toBe('Coldplay');
  });

  it('rejects invalid day', () => {
    expect(() =>
      Performance.parse({
        id: 'x',
        year: 2024,
        title: 'x',
        stage: 'x',
        area: 'x',
        day: 'TUESDAY',
        startsAt: '2024-06-29T22:00:00+01:00',
        endsAt: '2024-06-29T23:30:00+01:00',
      }),
    ).toThrow();
  });
});
