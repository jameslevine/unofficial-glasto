import { useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { usePins } from '../store/pins';
import { useAuth } from './useAuth';

export const usePinsSync = () => {
  const signedIn = useAuth();
  const synced = useRef(false);

  useEffect(() => {
    if (!signedIn) {
      synced.current = false;
      return;
    }
    if (synced.current) return;
    synced.current = true;

    const pending = usePins.getState().pendingForSync();
    const promise = pending.length
      ? api.syncPins(
          pending.map((p) => ({
            id: p.id,
            label: p.label,
            emoji: p.emoji,
            lat: p.lat,
            lon: p.lon,
            updatedAt: p.updatedAt,
            deleted: p.deleted,
          })),
        )
      : api.listPins();

    promise
      .then((rows) => {
        usePins.getState().applyServer(
          rows.map((r) => ({
            id: r.id,
            label: r.label,
            emoji: r.emoji,
            lat: r.lat,
            lon: r.lon,
            updatedAt: r.updatedAt,
            deleted: r.deleted,
          })),
        );
      })
      .catch((err: Error) => {
        console.warn('Pins sync failed:', err.message);
        synced.current = false;
      });
  }, [signedIn]);
};
