import { create } from 'zustand';

interface AudioPreviewState {
  currentId: string | null;
  isPlaying: boolean;
  durationMs: number;
  positionMs: number;
  play: (id: string, url: string) => Promise<void>;
  stop: () => void;
}

let audioEl: HTMLAudioElement | null = null;
let rafHandle: number | null = null;

const getAudioEl = (): HTMLAudioElement => {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = 'none';
  }
  return audioEl;
};

const cancelTick = () => {
  if (rafHandle !== null) {
    cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }
};

export const useAudioPreview = create<AudioPreviewState>((set, get) => {
  const tick = () => {
    if (!audioEl) return;
    set({ positionMs: audioEl.currentTime * 1000 });
    rafHandle = requestAnimationFrame(tick);
  };

  const stop = () => {
    cancelTick();
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
    }
    set({ currentId: null, isPlaying: false, positionMs: 0 });
  };

  const play = async (id: string, url: string) => {
    if (get().currentId === id && get().isPlaying) {
      stop();
      return;
    }
    const el = getAudioEl();
    cancelTick();
    el.pause();
    el.src = url;
    set({ currentId: id, isPlaying: false, positionMs: 0, durationMs: 0 });
    el.onloadedmetadata = () => {
      set({ durationMs: el.duration * 1000 });
    };
    el.onended = () => {
      stop();
    };
    el.onerror = () => {
      stop();
    };
    try {
      await el.play();
      set({ isPlaying: true });
      rafHandle = requestAnimationFrame(tick);
    } catch {
      stop();
    }
  };

  return {
    currentId: null,
    isPlaying: false,
    durationMs: 0,
    positionMs: 0,
    play,
    stop,
  };
});
