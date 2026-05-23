import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface FavouriteRecord {
  updatedAt: string;
  deleted: boolean;
}

interface FavouritesState {
  records: Record<string, FavouriteRecord>;
  ids: Record<string, true>;
  primaryByGroup: Record<string, string>;
  toggle: (perfId: string) => void;
  has: (perfId: string) => boolean;
  setPrimary: (groupId: string, perfId: string) => void;
  applyServer: (rows: Array<{ perfId: string; updatedAt: string; deleted: boolean }>) => void;
  pendingForSync: () => Array<{ perfId: string; updatedAt: string; deleted: boolean }>;
  clear: () => void;
}

const deriveIds = (records: Record<string, FavouriteRecord>): Record<string, true> => {
  const ids: Record<string, true> = {};
  for (const [perfId, rec] of Object.entries(records)) {
    if (!rec.deleted) ids[perfId] = true;
  }
  return ids;
};

export const useFavourites = create<FavouritesState>()(
  persist(
    (set, get) => ({
      records: {},
      ids: {},
      primaryByGroup: {},
      setPrimary: (groupId, perfId) =>
        set((state) => ({
          primaryByGroup: { ...state.primaryByGroup, [groupId]: perfId },
        })),
      toggle: (perfId) =>
        set((state) => {
          const now = new Date().toISOString();
          const existing = state.records[perfId];
          const next: FavouriteRecord = existing?.deleted
            ? { updatedAt: now, deleted: false }
            : existing
              ? { updatedAt: now, deleted: true }
              : { updatedAt: now, deleted: false };
          const records = { ...state.records, [perfId]: next };
          return { records, ids: deriveIds(records) };
        }),
      has: (perfId) => Boolean(get().ids[perfId]),
      applyServer: (rows) =>
        set((state) => {
          const records = { ...state.records };
          for (const row of rows) {
            const local = records[row.perfId];
            if (!local || row.updatedAt > local.updatedAt) {
              records[row.perfId] = { updatedAt: row.updatedAt, deleted: row.deleted };
            }
          }
          return { records, ids: deriveIds(records) };
        }),
      pendingForSync: () =>
        Object.entries(get().records).map(([perfId, rec]) => ({
          perfId,
          updatedAt: rec.updatedAt,
          deleted: rec.deleted,
        })),
      clear: () => set({ records: {}, ids: {}, primaryByGroup: {} }),
    }),
    {
      name: 'glasto-favourites',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persisted, version) => {
        let next = persisted as Record<string, unknown> | undefined;
        if (version < 2 && next && typeof next === 'object' && 'ids' in next) {
          const oldIds = (next as { ids: Record<string, true> }).ids ?? {};
          const now = new Date().toISOString();
          const records: Record<string, FavouriteRecord> = {};
          for (const id of Object.keys(oldIds)) {
            records[id] = { updatedAt: now, deleted: false };
          }
          next = { records, ids: deriveIds(records) };
        }
        if (next && typeof next === 'object' && !('primaryByGroup' in next)) {
          next = { ...next, primaryByGroup: {} };
        }
        return next;
      },
    },
  ),
);
