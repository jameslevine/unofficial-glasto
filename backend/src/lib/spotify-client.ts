import type { SpotifyTrack } from '@glasto/shared';

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

const getToken = async (): Promise<string> => {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.token;
  }
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set');
  }

  const body = new URLSearchParams({ grant_type: 'client_credentials' });
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!res.ok) throw new Error(`Spotify token request failed: ${res.status}`);

  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return tokenCache.token;
};

export interface SpotifyArtistMatch {
  id: string;
  name: string;
  imageUrl: string | null;
  url: string;
  genres: string[];
}

export const searchArtist = async (name: string): Promise<SpotifyArtistMatch | null> => {
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

export const getTopTracks = async (artistId: string): Promise<SpotifyTrack[]> => {
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
