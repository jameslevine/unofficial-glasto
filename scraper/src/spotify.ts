import type { Artist, Performance, SpotifyTrack } from '@glasto/shared';

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

const getToken = async (): Promise<string> => {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.token;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set');
  }
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Spotify token request failed: ${res.status}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return tokenCache.token;
};

interface SpotifyArtistMatch {
  id: string;
  name: string;
  url: string;
  imageUrl: string | null;
  genres: string[];
}

const searchArtist = async (name: string): Promise<SpotifyArtistMatch | null> => {
  const token = await getToken();
  const url = new URL('https://api.spotify.com/v1/search');
  url.searchParams.set('q', name);
  url.searchParams.set('type', 'artist');
  url.searchParams.set('market', 'GB');
  url.searchParams.set('limit', '5');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Spotify search failed: ${res.status}`);
  const json = (await res.json()) as {
    artists: {
      items: {
        id: string;
        name: string;
        external_urls: { spotify: string };
        images: { url: string }[];
        genres: string[];
      }[];
    };
  };
  const lower = name.toLowerCase();
  const exact = json.artists.items.find((a) => a.name.toLowerCase() === lower);
  const best = exact ?? json.artists.items[0];
  if (!best) return null;
  return {
    id: best.id,
    name: best.name,
    url: best.external_urls.spotify,
    imageUrl: best.images[0]?.url ?? null,
    genres: best.genres,
  };
};

const getTopTracks = async (artistId: string): Promise<SpotifyTrack[]> => {
  const token = await getToken();
  const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=GB`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Spotify top-tracks failed: ${res.status}`);
  const json = (await res.json()) as {
    tracks: { id: string; name: string; preview_url: string | null; duration_ms: number }[];
  };
  return json.tracks.slice(0, 10).map((t) => ({
    id: t.id,
    name: t.name,
    previewUrl: t.preview_url,
    durationMs: t.duration_ms,
  }));
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface ResolveOptions {
  delayMs?: number;
  onProgress?: (current: number, total: number, artist: string) => void;
}

/**
 * Resolve unique artists from a list of performances against the Spotify Web API.
 * Skips entries where the title looks like a non-musical session (talks, debates,
 * workshops, etc.) by simple keyword filtering. Pacing defaults to 350ms between
 * lookups to stay well under Spotify's 180 req/min Client Credentials limit.
 */
export const resolveArtistsForPerformances = async (
  performances: Performance[],
  opts: ResolveOptions = {},
): Promise<Artist[]> => {
  const delay = opts.delayMs ?? 350;
  const candidates = new Map<string, string>();
  for (const p of performances) {
    if (!p.artistSlug) continue;
    if (looksNonMusical(p.title)) continue;
    if (!candidates.has(p.artistSlug)) candidates.set(p.artistSlug, p.title);
  }

  const out: Artist[] = [];
  let i = 0;
  for (const [slug, name] of candidates) {
    i += 1;
    opts.onProgress?.(i, candidates.size, name);
    try {
      const match = await searchArtist(name);
      if (!match) {
        out.push(blankArtist(slug, name));
        await sleep(delay);
        continue;
      }
      const tracks = await getTopTracks(match.id);
      out.push({
        slug,
        name: match.name,
        spotifyId: match.id,
        spotifyUrl: match.url,
        imageUrl: match.imageUrl,
        genres: match.genres,
        topTracks: tracks,
        lastResolvedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn(`Spotify resolve failed for "${name}":`, (err as Error).message);
      out.push(blankArtist(slug, name));
    }
    await sleep(delay);
  }
  return out;
};

const NON_MUSICAL_TOKENS = [
  'DEBATE',
  'WORKSHOP',
  'TALK',
  'PANEL',
  'STORYTELLING',
  'YOGA',
  'MEDITATION',
  'LECTURE',
  'Q&A',
  'POETRY',
  'FILM',
  'SCREENING',
  'CABARET',
  'COMEDY',
  'HEALING',
  'TBA',
];

const looksNonMusical = (title: string): boolean => {
  const upper = title.toUpperCase();
  return NON_MUSICAL_TOKENS.some((tok) => upper.includes(tok));
};

const blankArtist = (slug: string, name: string): Artist => ({
  slug,
  name,
  spotifyId: null,
  spotifyUrl: null,
  imageUrl: null,
  genres: [],
  topTracks: [],
  lastResolvedAt: new Date().toISOString(),
});
