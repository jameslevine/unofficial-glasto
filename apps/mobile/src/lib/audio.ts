import { Audio } from 'expo-av';
import { AppState } from 'react-native';
import { create } from 'zustand';

interface AudioPreviewState {
  currentId: string | null;
  isPlaying: boolean;
  durationMs: number;
  positionMs: number;
  play: (id: string, url: string) => Promise<void>;
  stop: () => Promise<void>;
}

let sound: Audio.Sound | null = null;
let modeBootstrapped = false;

const bootstrap = async () => {
  if (modeBootstrapped) return;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });
  modeBootstrapped = true;
};

export const useAudioPreview = create<AudioPreviewState>((set, get) => {
  const stop = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch {
        // ignore
      }
      sound = null;
    }
    set({ currentId: null, isPlaying: false, positionMs: 0, durationMs: 0 });
  };

  const play = async (id: string, url: string) => {
    if (get().currentId === id && get().isPlaying) {
      await stop();
      return;
    }
    await bootstrap();
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch {
        // ignore
      }
      sound = null;
    }
    set({ currentId: id, isPlaying: false, positionMs: 0, durationMs: 0 });
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;
          set({
            isPlaying: status.isPlaying,
            positionMs: status.positionMillis,
            durationMs: status.durationMillis ?? 0,
          });
          if (status.didJustFinish) {
            void stop();
          }
        },
      );
      sound = newSound;
      set({ isPlaying: true });
    } catch {
      await stop();
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

AppState.addEventListener('change', (state) => {
  if (state !== 'active') {
    void useAudioPreview.getState().stop();
  }
});
