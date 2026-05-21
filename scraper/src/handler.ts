import { fetchYearHtml } from './fetch.js';
import { parseLineupHtml } from './parse.js';
import { upsertPerformances } from './upsert.js';

interface ScrapeEvent {
  year?: number;
}

const currentYear = () => new Date().getUTCFullYear();

export const handler = async (event: ScrapeEvent = {}) => {
  const year = event.year ?? currentYear();
  console.info(`scraper: fetching ${year}`);
  const html = await fetchYearHtml(year);
  const performances = parseLineupHtml({ html, year });
  console.info(`scraper: parsed ${performances.length} performances`);
  if (performances.length === 0) {
    return { ok: false, year, count: 0, message: 'no performances parsed' };
  }
  const written = await upsertPerformances(performances);
  return { ok: true, year, count: written };
};
