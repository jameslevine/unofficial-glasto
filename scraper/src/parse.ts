import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import type { DayOfFestival, Performance } from '@glasto/shared';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

const DAY_TOKENS: Record<string, DayOfFestival> = {
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY',
  SATURDAY: 'SATURDAY',
  SUNDAY: 'SUNDAY',
  MONDAY: 'MONDAY',
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);

const collapseWhitespace = (s: string) => s.replace(/\s+/g, ' ').trim();

export interface ParseInput {
  html: string;
  year: number;
}

interface FestivalDates {
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
}

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const parseFestivalDates = ($: cheerio.CheerioAPI, year: number): FestivalDates => {
  const raw = collapseWhitespace($('.festival-dates').first().text());
  const match = /(\d+)(?:st|nd|rd|th)?\D+(\d+)(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/.exec(raw);
  if (match) {
    const startDay = Number(match[1]);
    const endDay = Number(match[2]);
    const monthIdx = MONTHS[match[3]!.toLowerCase()];
    const yr = Number(match[4]);
    if (monthIdx !== undefined) {
      return {
        start: dayjs(new Date(yr, monthIdx, startDay)),
        end: dayjs(new Date(yr, monthIdx, endDay)),
      };
    }
  }
  const lastWedJune = dayjs(new Date(year, 5, 1));
  const offset = (3 - lastWedJune.day() + 7) % 7;
  const start = lastWedJune.add(20 + offset, 'day');
  return { start, end: start.add(4, 'day') };
};

const DAY_OFFSETS: Record<DayOfFestival, number> = {
  WEDNESDAY: 0,
  THURSDAY: 1,
  FRIDAY: 2,
  SATURDAY: 3,
  SUNDAY: 4,
  MONDAY: 5,
};

const dateForDay = (start: dayjs.Dayjs, day: DayOfFestival): dayjs.Dayjs => {
  const wedOffset = (start.day() - 3 + 7) % 7;
  const wed = start.subtract(wedOffset, 'day');
  return wed.add(DAY_OFFSETS[day], 'day');
};

const TIME_RE = /^(\d{1,2}):(\d{2})$/;

const buildIso = (date: dayjs.Dayjs, hhmm: string, isAfterMidnight: boolean): string | null => {
  const m = TIME_RE.exec(hhmm);
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  const target = isAfterMidnight ? date.add(1, 'day') : date;
  const local = new Date(target.year(), target.month(), target.date(), hours, minutes, 0);
  const offsetMinutes = -local.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const offHH = String(Math.floor(abs / 60)).padStart(2, '0');
  const offMM = String(abs % 60).padStart(2, '0');
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}` +
    `T${pad(local.getHours())}:${pad(local.getMinutes())}:00${sign}${offHH}:${offMM}`
  );
};

const parseTimingCell = (
  text: string,
  date: dayjs.Dayjs,
): { startsAt: string; endsAt: string } | null => {
  const cleaned = text
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const m = /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/.exec(cleaned);
  if (!m) return null;
  const startStr = m[1]!;
  const endStr = m[2]!;
  const startHour = Number(startStr.split(':')[0]);
  const endHour = Number(endStr.split(':')[0]);
  const startAfterMidnight = startHour < 6;
  const endAfterMidnight = startAfterMidnight || endHour < startHour;
  const startsAt = buildIso(date, startStr, startAfterMidnight);
  const endsAt = buildIso(date, endStr, endAfterMidnight);
  if (!startsAt || !endsAt) return null;
  return { startsAt, endsAt };
};

/**
 * Parse the HTML at glastonburyfestivals.co.uk/line-up/line-up-{year}/?view=stages.
 * Structure: .stage-group (area) → button[data-stage] (stage) → .stage-container
 *   → repeating .stage-day (h4) + <table> rows of <td>name</td><td class=timings>HH:MM - HH:MM</td>.
 */
export const parseLineupHtml = ({ html, year }: ParseInput): Performance[] => {
  const $ = cheerio.load(html);
  const dates = parseFestivalDates($, year);
  const performances: Performance[] = [];

  let currentArea = 'OTHER';

  $('.line-ups-outer')
    .first()
    .children()
    .each((_i, el) => {
      const $el = $(el);
      if ($el.is('h2.stage-group')) {
        currentArea = collapseWhitespace($el.text());
        return;
      }
      if ($el.is('h3.stage-name')) {
        const $btn = $el.find('button[data-stage]').first();
        const stageSlug = $btn.attr('data-stage')?.trim();
        const stageName = collapseWhitespace($btn.text());
        if (!stageSlug || !stageName) return;
        const $container = $el.next('.stage-container');
        if ($container.length === 0) return;

        let currentDay: DayOfFestival | null = null;
        $container.children().each((_j, child) => {
          const $child = $(child);
          if ($child.is('h4.stage-day')) {
            const dayToken = collapseWhitespace($child.text()).toUpperCase();
            currentDay = DAY_TOKENS[dayToken] ?? null;
            return;
          }
          if ($child.is('table') && currentDay) {
            const day: DayOfFestival = currentDay;
            const date = dateForDay(dates.start, day);
            $child.find('tr').each((_k, tr) => {
              const $tr = $(tr);
              const cells = $tr.find('td');
              if (cells.length < 2) return;
              const $nameCell = cells.eq(0);
              const $timingCell = cells.eq(1);
              if (!$timingCell.hasClass('timings')) return;
              const $link = $nameCell.find('a.artist-link').first();
              const title =
                collapseWhitespace($link.text()) || collapseWhitespace($nameCell.text());
              if (!title || title.toUpperCase() === 'TBA') return;
              const timing = parseTimingCell($timingCell.text(), date);
              if (!timing) return;
              const description =
                $link.attr('title') ?? $nameCell.find('[title]').first().attr('title');
              const sourceUrl = $link.attr('href') ?? undefined;
              const id =
                `${year}-${stageSlug}-${slugify(title)}-${day.toLowerCase()}-` +
                `${timing.startsAt.slice(11, 16).replace(':', '')}`;
              performances.push({
                id,
                year,
                title,
                artistSlug: slugify(title),
                stage: stageName,
                area: currentArea,
                day,
                startsAt: timing.startsAt,
                endsAt: timing.endsAt,
                description: description ? collapseWhitespace(description) : undefined,
                sourceUrl,
              });
            });
          }
        });
      }
    });

  return performances;
};
