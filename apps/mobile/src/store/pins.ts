import AsyncStorage from '@react-native-async-storage/async-storage';
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
  dirty: Record<string, true>;
  upsert: (input: {
    id?: string;
    label: string;
    emoji?: string;
    lat: number;
    lon: number;
  }) => string;
  remove: (id: string) => void;
  applyServer: (rows: PinRecord[]) => void;
  markSynced: (ids: string[]) => void;
  pendingForSync: () => PinRecord[];
  active: () => PinRecord[];
  clear: () => void;
}

const newId = () => `pin_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

export const usePins = create<PinsState>()(
  persist(
    (set, get) => ({
      records: {},
      dirty: {},
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
          dirty: { ...state.dirty, [pinId]: true },
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
            dirty: { ...state.dirty, [id]: true },
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
      markSynced: (ids) =>
        set((state) => {
          if (ids.length === 0) return state;
          const dirty = { ...state.dirty };
          for (const id of ids) delete dirty[id];
          return { dirty };
        }),
      pendingForSync: () => {
        const { records, dirty } = get();
        return Object.keys(dirty)
          .map((id) => records[id])
          .filter((r): r is PinRecord => Boolean(r));
      },
      active: () => Object.values(get().records).filter((r) => !r.deleted),
      clear: () => set({ records: {}, dirty: {} }),
    }),
    {
      name: 'glasto-pins',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted: unknown, version) => {
        if (version < 2 && persisted && typeof persisted === 'object') {
          const state = persisted as { records?: Record<string, PinRecord> };
          const records = state.records ?? {};
          return {
            records,
            dirty: Object.fromEntries(Object.keys(records).map((id) => [id, true])),
          };
        }
        return persisted as PinsState;
      },
    },
  ),
);
