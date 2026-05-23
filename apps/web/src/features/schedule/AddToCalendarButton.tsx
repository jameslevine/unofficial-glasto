import { useCallback, useEffect, useRef, useState } from 'react';
import { buildGoogleCalendarUrl, buildIcs } from '@glasto/shared';
import type { Performance } from '@glasto/shared';

interface Props {
  performance: Performance;
}

export const AddToCalendarButton = ({ performance }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const onDownload = useCallback(() => {
    const ics = buildIcs([{ performance }]);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const slug = performance.artistSlug ?? performance.id;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setOpen(false);
  }, [performance]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Add to calendar"
        className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted transition hover:border-brand hover:text-brand"
      >
        Add to calendar
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-md border border-border bg-surface shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={onDownload}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-2"
          >
            Download .ics
          </button>
          <a
            role="menuitem"
            href={buildGoogleCalendarUrl({ performance })}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-2"
          >
            Google Calendar ↗
          </a>
        </div>
      )}
    </div>
  );
};
