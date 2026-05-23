import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface PinRecord {
  id: string;
  label: string;
  emoji?: string;
  lat: number;
  lon: number;
  updatedAt: string;
  deleted: boolean;
}

interface PinsState {
  records: Record<string, PinRecord>;
  upsert: (input: {
    id?: string;
    label: string;
    emoji?: string;
    lat: number;
    lon: number;
  }) => string;
  remove: (id: string) => void;
  applyServer: (rows: PinRecord[]) => void;
  pendingForSync: () => PinRecord[];
  active: () => PinRecord[];
  clear: () => void;
}

const newId = () => `pin_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

export const usePins = create<PinsState>()(
  persist(
    (set, get) => ({
      records: {},
      upsert: ({ id, label, emoji, lat, lon }) => {
        const now = new Date().toISOString();
        const pinId = id ?? newId();
        set((state) => ({
          records: {
            ...state.records,
            [pinId]: {
              id: pinId,
              label: label.trim() || 'Pin',
              emoji,
              lat,
              lon,
              updatedAt: now,
              deleted: false,
            },
          },
        }));
        return pinId;
      },
      remove: (id) =>
        set((state) => {
          const existing = state.records[id];
          if (!existing) return state;
          return {
            records: {
              ...state.records,
              [id]: { ...existing, deleted: true, updatedAt: new Date().toISOString() },
            },
          };
        }),
      applyServer: (rows) =>
        set((state) => {
          const records = { ...state.records };
          for (const row of rows) {
            const local = records[row.id];
            if (!local || row.updatedAt > local.updatedAt) {
              records[row.id] = { ...row };
            }
          }
          return { records };
        }),
      pendingForSync: () => Object.values(get().records),
      active: () => Object.values(get().records).filter((r) => !r.deleted),
      clear: () => set({ records: {} }),
    }),
    {
      name: 'glasto-pins',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
