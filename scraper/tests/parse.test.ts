import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Performance } from '@glasto/shared';
import { parseLineupHtml } from '../src/parse.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(resolve(__dirname, 'fixtures', name), 'utf8');

describe('parseLineupHtml', () => {
  it('returns an empty array when there are no stage elements', () => {
    expect(parseLineupHtml({ html: '<html><body></body></html>', year: 2024 })).toEqual([]);
  });

  it('parses the 2024 fixture into hundreds of performances across music and non-music areas', () => {
    const html = fixture('2024-stages.html');
    const perfs = parseLineupHtml({ html, year: 2024 });
    expect(perfs.length).toBeGreaterThan(1000);
    for (const p of perfs) Performance.parse(p);
    const areas = new Set(perfs.map((p) => p.area));
    expect(areas.has('MAIN STAGES')).toBe(true);
    expect(areas.has('GREEN FIELDS')).toBe(true);
    expect(areas.has('THEATRE & CIRCUS FIELDS')).toBe(true);
    expect(areas.has('KIDZ FIELD')).toBe(true);
    const dua = perfs.find((p) => p.title === 'DUA LIPA' && p.stage === 'PYRAMID STAGE');
    expect(dua).toBeDefined();
    expect(dua?.day).toBe('FRIDAY');
    expect(dua?.startsAt).toBe('2024-06-28T22:00:00+01:00');
    expect(dua?.endsAt).toBe('2024-06-28T23:45:00+01:00');
  });
});
