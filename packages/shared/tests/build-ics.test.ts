import { describe, expect, it } from 'vitest';
import { buildGoogleCalendarUrl, buildIcs } from '../src/ics/build-ics.js';
import type { Performance } from '../src/types/index.js';

const FIXED_NOW = new Date('2026-05-23T12:00:00Z');

const perf = (overrides: Partial<Performance> & Pick<Performance, 'id'>): Performance => ({
  year: 2024,
  title: 'Coldplay',
  stage: 'Pyramid Stage',
  area: 'Music',
  day: 'SATURDAY',
  startsAt: '2024-06-29T22:15:00+01:00',
  endsAt: '2024-06-30T00:15:00+01:00',
  description: undefined,
  artistSlug: 'coldplay',
  sourceUrl: undefined,
  ...overrides,
});

describe('buildIcs', () => {
  it('emits CRLF line endings', () => {
    const ics = buildIcs([{ performance: perf({ id: 'p1' }) }], { now: FIXED_NOW });
    expect(ics.includes('\r\n')).toBe(true);
    expect(ics.split('\n').every((line) => line.endsWith('\r') || line === '')).toBe(true);
  });

  it('wraps with VCALENDAR + Europe/London VTIMEZONE', () => {
    const ics = buildIcs([{ performance: perf({ id: 'p1' }) }], { now: FIXED_NOW });
    expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    expect(ics).toContain('TZID:Europe/London');
    expect(ics).toContain('BEGIN:DAYLIGHT');
    expect(ics).toContain('TZNAME:BST');
    expect(ics).toContain('TZNAME:GMT');
  });

  it('formats DTSTART/DTEND as local wall time with TZID, not UTC', () => {
    const ics = buildIcs([{ performance: perf({ id: 'p1' }) }], { now: FIXED_NOW });
    expect(ics).toContain('DTSTART;TZID=Europe/London:20240629T221500');
    expect(ics).toContain('DTEND;TZID=Europe/London:20240630T001500');
    // Should NOT use Z-suffixed UTC for the event times.
    expect(ics).not.toMatch(/DTSTART:[^\r\n]*Z\r\n/);
  });

  it('uses UID with @unofficial-glasto domain', () => {
    const ics = buildIcs([{ performance: perf({ id: '2024-coldplay-pyramid' }) }], {
      now: FIXED_NOW,
    });
    expect(ics).toContain('UID:2024-coldplay-pyramid@unofficial-glasto');
  });

  it('escapes commas, semicolons, backslashes and newlines in TEXT fields', () => {
    const ics = buildIcs(
      [
        {
          performance: perf({
            id: 'p1',
            title: 'Hot, Spicy; Loud\\Soft',
            description: 'Line one\nLine two',
          }),
        },
      ],
      { now: FIXED_NOW },
    );
    expect(ics).toContain('SUMMARY:Hot\\, Spicy\\; Loud\\\\Soft');
    expect(ics).toContain('DESCRIPTION:Line one\\nLine two');
  });

  it('folds lines longer than 75 octets with CRLF + space', () => {
    const longTitle =
      'A very long performance title that will absolutely exceed the seventy-five octet limit per RFC 5545';
    const ics = buildIcs([{ performance: perf({ id: 'p1', title: longTitle }) }], {
      now: FIXED_NOW,
    });
    const lines = ics.split('\r\n');
    for (const line of lines) {
      const bytes = new TextEncoder().encode(line);
      expect(bytes.length).toBeLessThanOrEqual(75);
    }
    // Continuation lines start with a single space.
    expect(ics).toMatch(/\r\n /);
  });

  it('uses the supplied DTSTAMP when `now` is passed', () => {
    const ics = buildIcs([{ performance: perf({ id: 'p1' }) }], { now: FIXED_NOW });
    expect(ics).toContain('DTSTAMP:20260523T120000Z');
  });

  it('emits one VEVENT per supplied event', () => {
    const ics = buildIcs(
      [
        { performance: perf({ id: 'p1' }) },
        { performance: perf({ id: 'p2', title: 'Dua Lipa' }) },
        { performance: perf({ id: 'p3', title: 'SZA' }) },
      ],
      { now: FIXED_NOW },
    );
    const veventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(veventCount).toBe(3);
  });

  it('falls back to stage · area when no location supplied', () => {
    const ics = buildIcs([{ performance: perf({ id: 'p1' }) }], { now: FIXED_NOW });
    expect(ics).toContain('LOCATION:Pyramid Stage · Music');
  });
});

describe('buildGoogleCalendarUrl', () => {
  it('builds a TEMPLATE link with Europe/London tz and local wall times', () => {
    const url = buildGoogleCalendarUrl({ performance: perf({ id: 'p1' }) });
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('text=Coldplay');
    expect(url).toContain('dates=20240629T221500%2F20240630T001500');
    expect(url).toContain('ctz=Europe%2FLondon');
  });
});
