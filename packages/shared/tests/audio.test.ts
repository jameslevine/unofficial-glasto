import { describe, expect, it } from 'vitest';
import { pickPreviewTrack, topGenres } from '../src/audio/pick-preview-track.js';

describe('pickPreviewTrack', () => {
  it('returns null for null/undefined artist', () => {
    expect(pickPreviewTrack(null)).toBeNull();
    expect(pickPreviewTrack(undefined)).toBeNull();
  });

  it('returns null when topTracks is empty', () => {
    expect(pickPreviewTrack({ topTracks: [] })).toBeNull();
  });

  it('returns null when no track has a previewUrl', () => {
    expect(
      pickPreviewTrack({
        topTracks: [
          { id: 'a', name: 'A', previewUrl: null, durationMs: 1000 },
          { id: 'b', name: 'B', previewUrl: null, durationMs: 2000 },
        ],
      }),
    ).toBeNull();
  });

  it('returns first track that has a previewUrl, even if not the first in the list', () => {
    const result = pickPreviewTrack({
      topTracks: [
        { id: 'a', name: 'A', previewUrl: null, durationMs: 1000 },
        {
          id: 'b',
          name: 'B',
          previewUrl: 'https://p.scdn.co/mp3-preview/x',
          durationMs: 2000,
        },
      ],
    });
    expect(result?.id).toBe('b');
  });
});

describe('topGenres', () => {
  it('returns sorted by frequency descending', () => {
    const rows = [{ genres: ['indie', 'rock'] }, { genres: ['indie'] }, { genres: ['techno'] }];
    expect(topGenres(rows)).toEqual(['indie', 'rock', 'techno']);
  });

  it('caps at the requested max', () => {
    const rows = [{ genres: ['a', 'b', 'c', 'd', 'e'] }, { genres: ['a', 'b'] }];
    expect(topGenres(rows, 2)).toEqual(['a', 'b']);
  });

  it('returns empty array for empty input', () => {
    expect(topGenres([])).toEqual([]);
  });
});
