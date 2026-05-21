import { describe, expect, it } from 'vitest';
import { parseLineupHtml } from '../src/parse.js';

describe('parseLineupHtml', () => {
  it('returns an empty array when there are no stage elements', () => {
    expect(parseLineupHtml({ html: '<html><body></body></html>', year: 2024 })).toEqual([]);
  });

  it('parses a single performance from the data attributes', () => {
    const html = `
      <div data-stage="Pyramid Stage" data-area="Music">
        <div data-performance
             data-day="SATURDAY"
             data-start="2024-06-29T22:00:00+01:00"
             data-end="2024-06-29T23:30:00+01:00">
          <span data-title>Coldplay</span>
          <a href="https://example.com/coldplay">link</a>
        </div>
      </div>
    `;
    const result = parseLineupHtml({ html, year: 2024 });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      title: 'Coldplay',
      stage: 'Pyramid Stage',
      area: 'Music',
      day: 'SATURDAY',
      year: 2024,
    });
  });
});
