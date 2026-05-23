import type { Artist, SpotifyTrack } from '../types/index.js';

export const pickPreviewTrack = (
  artist: Pick<Artist, 'topTracks'> | null | undefined,
): SpotifyTrack | null => {
  const tracks = artist?.topTracks ?? [];
  for (const t of tracks) {
    if (t.previewUrl) return t;
  }
  return null;
};

export const topGenres = (rows: Array<{ genres: string[] }>, max = 30): string[] => {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const g of row.genres) {
      counts.set(g, (counts.get(g) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([g]) => g);
};
