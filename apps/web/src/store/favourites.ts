import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FavouritesState {
  ids: Record<string, true>;
  toggle: (perfId: string) => void;
  has: (perfId: string) => boolean;
  clear: () => void;
}

export const useFavourites = create<FavouritesState>()(
  persist(
    (set, get) => ({
      ids: {},
      toggle: (perfId) =>
        set((state) => {
          const next = { ...state.ids };
          if (next[perfId]) delete next[perfId];
          else next[perfId] = true;
          return { ids: next };
        }),
      has: (perfId) => Boolean(get().ids[perfId]),
      clear: () => set({ ids: {} }),
    }),
    {
      name: 'glasto-favourites',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
