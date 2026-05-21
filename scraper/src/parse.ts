import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import type { DayOfFestival, Performance } from '@glasto/shared';

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

export interface ParseInput {
  html: string;
  year: number;
}

/**
 * Parse the HTML at glastonburyfestivals.co.uk/line-up/line-up-{year}/?view=stages.
 * Skeleton implementation — selectors will be tuned in Phase 1 against fixtures
 * captured from the live site, mirroring the approach in glastoscrape.
 */
export const parseLineupHtml = ({ html, year }: ParseInput): Performance[] => {
  const $ = cheerio.load(html);
  const performances: Performance[] = [];

  $('[data-stage]').each((_i, stageEl) => {
    const stage = $(stageEl).attr('data-stage')?.trim() ?? 'Unknown';
    const area = $(stageEl).attr('data-area')?.trim() ?? stage;

    $(stageEl)
      .find('[data-performance]')
      .each((_j, perfEl) => {
        const $p = $(perfEl);
        const title = $p.find('[data-title]').text().trim();
        if (!title) return;

        const dayRaw = ($p.attr('data-day') ?? '').toUpperCase();
        const day = DAY_TOKENS[dayRaw] ?? 'FRIDAY';

        const startsAt = $p.attr('data-start');
        const endsAt = $p.attr('data-end');
        if (!startsAt || !endsAt) return;

        const id = `${year}-${slugify(stage)}-${slugify(title)}-${slugify(day)}-${dayjs(startsAt).format('HHmm')}`;

        performances.push({
          id,
          year,
          title,
          artistSlug: slugify(title),
          stage,
          area,
          day,
          startsAt,
          endsAt,
          description: $p.find('[data-description]').text().trim() || undefined,
          sourceUrl: $p.find('a').attr('href') ?? undefined,
        });
      });
  });

  return performances;
};
