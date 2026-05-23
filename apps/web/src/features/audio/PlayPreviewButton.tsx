import { useAudioPreview } from '../../lib/audio';

interface Props {
  id: string;
  previewUrl: string | null | undefined;
  size?: 'sm' | 'md';
}

export const PlayPreviewButton = ({ id, previewUrl, size = 'sm' }: Props) => {
  const currentId = useAudioPreview((s) => s.currentId);
  const isPlaying = useAudioPreview((s) => s.isPlaying);
  const positionMs = useAudioPreview((s) => s.positionMs);
  const durationMs = useAudioPreview((s) => s.durationMs);
  const play = useAudioPreview((s) => s.play);
  const stop = useAudioPreview((s) => s.stop);

  if (!previewUrl) return null;

  const isCurrent = currentId === id;
  const active = isCurrent && isPlaying;
  const progress = isCurrent && durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;

  const dim = size === 'md' ? 32 : 24;
  const fontSize = size === 'md' ? 14 : 11;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => (active ? stop() : play(id, previewUrl))}
        aria-label={active ? 'Pause preview' : 'Play preview'}
        aria-pressed={active}
        style={{ width: dim, height: dim, fontSize }}
        className="flex items-center justify-center rounded-full bg-brand text-bg transition hover:opacity-90"
      >
        {active ? '❚❚' : '▶'}
      </button>
      {isCurrent && durationMs > 0 && (
        <div className="h-1 w-12 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
          <div
            className="h-full bg-brand transition-[width] duration-150"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};
