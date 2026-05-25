import { useEffect } from 'react';
import { api } from '../lib/api';
import { usePins, type PinRecord } from '../store/pins';

const FLUSH_DELAY_MS = 400;

const toPayload = (p: PinRecord) => ({
  id: p.id,
  label: p.label,
  emoji: p.emoji,
  lat: p.lat,
  lon: p.lon,
  updatedAt: p.updatedAt,
  deleted: p.deleted,
});

export const usePinsSync = (signedIn: boolean) => {
  useEffect(() => {
    if (!signedIn) return;

    let cancelled = false;
    let flushTimer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;

    const flush = async () => {
      if (cancelled || inFlight) return;
      const pending = usePins.getState().pendingForSync();
      if (pending.length === 0) return;
      inFlight = true;
      const ids = pending.map((p) => p.id);
      try {
        const rows = await api.syncPins(pending.map(toPayload));
        if (cancelled) return;
        usePins.getState().applyServer(rows);
        usePins.getState().markSynced(ids);
      } catch (err) {
        console.warn('Pins sync failed:', (err as Error).message);
      } finally {
        inFlight = false;
        if (!cancelled && Object.keys(usePins.getState().dirty).length > 0) {
          scheduleFlush();
        }
      }
    };

    const scheduleFlush = () => {
      if (flushTimer) clearTimeout(flushTimer);
      flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
    };

    (async () => {
      const pending = usePins.getState().pendingForSync();
      try {
        const rows = pending.length
          ? await api.syncPins(pending.map(toPayload))
          : await api.listPins();
        if (cancelled) return;
        usePins.getState().applyServer(rows);
        if (pending.length) usePins.getState().markSynced(pending.map((p) => p.id));
      } catch (err) {
        console.warn('Pins initial sync failed:', (err as Error).message);
      }
    })();

    const unsubscribe = usePins.subscribe((state, prev) => {
      if (state.dirty !== prev.dirty && Object.keys(state.dirty).length > 0) {
        scheduleFlush();
      }
    });

    return () => {
      cancelled = true;
      if (flushTimer) clearTimeout(flushTimer);
      unsubscribe();
    };
  }, [signedIn]);
};
