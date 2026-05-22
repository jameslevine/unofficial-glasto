import { useEffect, useState } from 'react';
import { getStoredTokens } from '../lib/auth';

const hasToken = () => Boolean(getStoredTokens());

export const useAuth = () => {
  const [signedIn, setSignedIn] = useState<boolean>(hasToken);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'glasto-auth-tokens' || e.key === null) {
        setSignedIn(hasToken());
      }
    };
    window.addEventListener('storage', onStorage);
    const interval = window.setInterval(() => {
      setSignedIn(hasToken());
    }, 60_000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(interval);
    };
  }, []);

  return signedIn;
};
