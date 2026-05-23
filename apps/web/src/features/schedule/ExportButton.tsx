import { useCallback } from 'react';
import { buildIcs } from '@glasto/shared';
import type { Performance } from '@glasto/shared';

interface Props {
  performances: Performance[];
  filename?: string;
  className?: string;
  disabled?: boolean;
}

export const ExportButton = ({
  performances,
  filename = 'glastonbury-schedule.ics',
  className,
  disabled,
}: Props) => {
  const onClick = useCallback(() => {
    if (performances.length === 0) return;
    const ics = buildIcs(performances.map((performance) => ({ performance })));
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [performances, filename]);

  return (
    <button
      type="button"
      className={className ?? 'btn'}
      onClick={onClick}
      disabled={disabled || performances.length === 0}
      aria-label="Export schedule as calendar file"
    >
      Export schedule
    </button>
  );
};
