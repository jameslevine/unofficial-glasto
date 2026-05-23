import type { DayOfFestival } from '@glasto/shared';

const DAYS: DayOfFestival[] = ['WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY', 'MONDAY'];

interface Props {
  search: string;
  onSearch: (s: string) => void;
  day: DayOfFestival | '__ALL__';
  onDay: (d: DayOfFestival | '__ALL__') => void;
  area: string;
  onArea: (a: string) => void;
  areas: string[];
  allValue: '__ALL__';
  genres: string[];
  selectedGenres: string[];
  onToggleGenre: (genre: string) => void;
  onClearGenres: () => void;
}

export const FilterBar = ({
  search,
  onSearch,
  day,
  onDay,
  area,
  onArea,
  areas,
  allValue,
  genres,
  selectedGenres,
  onToggleGenre,
  onClearGenres,
}: Props) => (
  <div className="space-y-3 rounded-lg border border-border bg-surface p-3">
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        id="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search artist or stage…"
        className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm placeholder:text-muted focus:border-brand focus:outline-none"
        type="search"
      />
      <select
        aria-label="Area"
        value={area}
        onChange={(e) => onArea(e.target.value)}
        className="rounded-md border border-border bg-bg px-2 py-2 text-sm"
      >
        <option value={allValue}>All areas</option>
        {areas.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </div>

    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onDay(allValue)}
        className={`chip ${day === allValue ? 'chip-active' : ''}`}
      >
        All days
      </button>
      {DAYS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onDay(d)}
          className={`chip ${day === d ? 'chip-active' : ''}`}
        >
          {d.slice(0, 3)}
        </button>
      ))}
    </div>

    {genres.length > 0 && (
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter by genre">
        <button
          type="button"
          onClick={onClearGenres}
          aria-pressed={selectedGenres.length === 0}
          className={`chip shrink-0 ${selectedGenres.length === 0 ? 'chip-active' : ''}`}
        >
          All genres
        </button>
        {genres.map((g) => {
          const active = selectedGenres.includes(g);
          return (
            <button
              key={g}
              type="button"
              onClick={() => onToggleGenre(g)}
              aria-pressed={active}
              className={`chip shrink-0 ${active ? 'chip-active' : ''}`}
            >
              {g}
            </button>
          );
        })}
      </div>
    )}
  </div>
);
