import type { Performance } from '../types/index.js';

export interface IcsEvent {
  performance: Performance;
  url?: string;
  location?: string;
}

const CRLF = '\r\n';

const escapeText = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');

const foldLine = (line: string): string => {
  // RFC 5545 §3.1: lines SHOULD NOT exceed 75 octets (UTF-8 bytes); fold with CRLF + single space.
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);
  if (bytes.length <= 75) return line;
  const decoder = new TextDecoder();
  const out: string[] = [];
  let i = 0;
  while (i < bytes.length) {
    const limit = i === 0 ? 75 : 74; // continuation lines start with one space, leaving 74 octets
    let end = Math.min(i + limit, bytes.length);
    // Don't split a multi-byte UTF-8 sequence.
    while (end > i && end < bytes.length) {
      const byte = bytes[end];
      if (byte === undefined) break;
      if ((byte & 0xc0) !== 0x80) break;
      end -= 1;
    }
    out.push(decoder.decode(bytes.subarray(i, end)));
    i = end;
  }
  return out.join(`${CRLF} `);
};

const formatLocalNoTz = (iso: string): string => {
  // ISO `2024-06-28T22:00:00+01:00` → `20240628T220000` (local wall time, paired with TZID).
  const match = iso.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/,
  );
  if (!match) throw new Error(`Invalid ISO datetime: ${iso}`);
  const [, y, m, d, hh, mm, ss] = match;
  return `${y}${m}${d}T${hh}${mm}${ss}`;
};

const formatUtcCompact = (date: Date): string => {
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return (
    `${date.getUTCFullYear()}` +
    `${pad(date.getUTCMonth() + 1)}` +
    `${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}` +
    `${pad(date.getUTCMinutes())}` +
    `${pad(date.getUTCSeconds())}Z`
  );
};

const EUROPE_LONDON_VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/London',
  'X-LIC-LOCATION:Europe/London',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0000',
  'TZOFFSETTO:+0100',
  'TZNAME:BST',
  'DTSTART:19700329T010000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0000',
  'TZNAME:GMT',
  'DTSTART:19701025T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

export interface BuildIcsOptions {
  prodId?: string;
  calendarName?: string;
  /** Override DTSTAMP (used for deterministic snapshot tests). */
  now?: Date;
}

export const buildIcs = (events: IcsEvent[], opts: BuildIcsOptions = {}): string => {
  const prodId = opts.prodId ?? '-//Unofficial Glasto//Schedule//EN';
  const dtstamp = formatUtcCompact(opts.now ?? new Date());
  const calendarName = opts.calendarName ?? 'My Glastonbury Schedule';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    'X-WR-TIMEZONE:Europe/London',
    ...EUROPE_LONDON_VTIMEZONE,
  ];

  for (const event of events) {
    const { performance } = event;
    const dtstart = formatLocalNoTz(performance.startsAt);
    const dtend = formatLocalNoTz(performance.endsAt);
    const summary = escapeText(performance.title);
    const location = escapeText(event.location ?? `${performance.stage} · ${performance.area}`);

    lines.push(
      'BEGIN:VEVENT',
      `UID:${performance.id}@unofficial-glasto`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=Europe/London:${dtstart}`,
      `DTEND;TZID=Europe/London:${dtend}`,
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
    );
    if (performance.description) {
      lines.push(`DESCRIPTION:${escapeText(performance.description)}`);
    }
    const url = event.url ?? performance.sourceUrl;
    if (url) lines.push(`URL:${url}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.map(foldLine).join(CRLF) + CRLF;
};

export const buildGoogleCalendarUrl = (event: IcsEvent): string => {
  const { performance } = event;
  const dates = `${formatLocalNoTz(performance.startsAt)}/${formatLocalNoTz(performance.endsAt)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: performance.title,
    dates,
    ctz: 'Europe/London',
    location: event.location ?? `${performance.stage} · ${performance.area}`,
  });
  if (performance.description) params.set('details', performance.description);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
