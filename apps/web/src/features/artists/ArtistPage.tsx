import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { pickPreviewTrack, useArtist } from '@glasto/shared';
import { api } from '../../lib/api';
import { PlayPreviewButton } from '../audio/PlayPreviewButton';

export const ArtistPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const name = params.get('name') ?? undefined;
  const query = useArtist(api, slug, name);

  const fallbackName = useMemo(() => name ?? humanize(slug ?? ''), [name, slug]);

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface" />
        <div className="h-64 animate-pulse rounded-lg border border-border bg-surface" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm">
        <p className="font-semibold">Couldn't load artist.</p>
        <p className="mt-1 text-muted">{(query.error as Error).message}</p>
        <button className="btn mt-3" onClick={() => query.refetch()}>
          Retry
        </button>
      </div>
    );
  }

  const artist = query.data;
  if (!artist) return null;

  const hasSpotify = !!artist.spotifyId;
  const previewTrack = pickPreviewTrack(artist);

  return (
    <article className="space-y-6">
      <header className="flex items-start gap-4">
        {artist.imageUrl ? (
          <img
            src={artist.imageUrl}
            alt=""
            className="h-24 w-24 shrink-0 rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-2xl text-muted"
          >
            ♪
          </div>
        )}
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {artist.name || fallbackName}
          </h1>
          {artist.genres.length > 0 && (
            <ul className="flex flex-wrap gap-2 text-xs text-muted">
              {artist.genres.slice(0, 5).map((g) => (
                <li key={g} className="rounded-full border border-border bg-surface px-2 py-0.5">
                  {g}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {previewTrack?.previewUrl && (
              <div className="flex items-center gap-2">
                <PlayPreviewButton
                  id={`artist-${artist.slug}`}
                  previewUrl={previewTrack.previewUrl}
                  size="md"
                />
                <span className="text-xs text-muted">Preview "{previewTrack.name}"</span>
              </div>
            )}
            {hasSpotify && (
              <a
                href={artist.spotifyUrl ?? `https://open.spotify.com/artist/${artist.spotifyId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-brand hover:underline"
              >
                Open in Spotify ↗
              </a>
            )}
          </div>
        </div>
      </header>

      {hasSpotify ? (
        <section aria-label="Spotify player" className="space-y-2">
          <iframe
            title={`${artist.name} on Spotify`}
            src={`https://open.spotify.com/embed/artist/${artist.spotifyId}?utm_source=generator&theme=0`}
            className="h-[352px] w-full rounded-xl border border-border bg-surface"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        </section>
      ) : (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          No Spotify match found for this artist.
        </p>
      )}

      <Link to="/" className="text-sm text-muted hover:text-fg">
        ← Back to lineup
      </Link>
    </article>
  );
};

const humanize = (slug: string) =>
  slug
    .split('-')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
