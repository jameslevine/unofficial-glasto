import { fetchYearHtml } from './fetch.js';
import { parseLineupHtml } from './parse.js';
import { resolveArtistsForPerformances } from './spotify.js';
import { upsertArtists, upsertPerformances } from './upsert.js';

interface ScrapeEvent {
  year?: number;
  resolveSpotify?: boolean;
}

const currentYear = () => new Date().getUTCFullYear();

export const handler = async (event: ScrapeEvent = {}) => {
  const year = event.year ?? currentYear();
  const resolveSpotify = event.resolveSpotify ?? Boolean(process.env.SPOTIFY_CLIENT_ID);
  console.info(`scraper: fetching ${year}`);
  const html = await fetchYearHtml(year);
  const performances = parseLineupHtml({ html, year });
  console.info(`scraper: parsed ${performances.length} performances`);
  if (performances.length === 0) {
    return { ok: false, year, performances: 0, artists: 0, message: 'no performances parsed' };
  }
  const performancesWritten = await upsertPerformances(performances);

  let artistsWritten = 0;
  if (resolveSpotify) {
    const artists = await resolveArtistsForPerformances(performances);
    artistsWritten = await upsertArtists(artists);
    console.info(`scraper: wrote ${artistsWritten} artist records`);
  }

  return { ok: true, year, performances: performancesWritten, artists: artistsWritten };
};
