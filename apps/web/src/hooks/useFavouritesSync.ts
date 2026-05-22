import { useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useFavourites } from '../store/favourites';
import { useAuth } from './useAuth';

export const useFavouritesSync = () => {
  const signedIn = useAuth();
  const synced = useRef(false);

  useEffect(() => {
    if (!signedIn) {
      synced.current = false;
      return;
    }
    if (synced.current) return;
    synced.current = true;

    const pending = useFavourites.getState().pendingForSync();
    const promise = pending.length ? api.syncFavourites(pending) : api.listFavourites();

    promise
      .then((rows) => {
        useFavourites
          .getState()
          .applyServer(
            rows.map((r) => ({ perfId: r.perfId, updatedAt: r.updatedAt, deleted: r.deleted })),
          );
      })
      .catch((err: Error) => {
        console.warn('Favourites sync failed:', err.message);
        synced.current = false;
      });
  }, [signedIn]);
};
