import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useOnline } from '../hooks/useOnline';
import { useAuth } from '../hooks/useAuth';
import { useFavouritesSync } from '../hooks/useFavouritesSync';
import { usePinsSync } from '../hooks/usePinsSync';
import { beginSignIn, isAuthConfigured, signOut } from '../lib/auth';

const YEARS = [2025, 2024, 2023, 2022] as const;

export const AppLayout = () => {
  const online = useOnline();
  const signedIn = useAuth();
  const authReady = isAuthConfigured();
  const location = useLocation();
  useFavouritesSync();
  usePinsSync();
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <span aria-hidden className="text-2xl">
              ⛺
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              Unofficial Glasto
            </span>
          </NavLink>

          <nav aria-label="Year" className="flex flex-wrap items-center gap-1.5">
            {YEARS.map((y) => (
              <NavLink
                key={y}
                to={`/lineup/${y}`}
                end
                className={({ isActive }) => `chip ${isActive ? 'chip-active' : ''}`}
              >
                {y}
              </NavLink>
            ))}
            <NavLink
              to="/map"
              className={({ isActive }) => `chip ${isActive ? 'chip-active' : ''}`}
            >
              Map
            </NavLink>
            <NavLink
              to="/favourites"
              className={({ isActive }) => `chip ${isActive ? 'chip-active' : ''}`}
            >
              ★ Favourites
            </NavLink>
            {authReady &&
              (signedIn ? (
                <button type="button" className="chip" onClick={() => signOut()}>
                  Sign out
                </button>
              ) : (
                <button
                  type="button"
                  className="chip"
                  onClick={() => beginSignIn(location.pathname + location.search)}
                >
                  Sign in
                </button>
              ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-muted">
        Unofficial — fan-made. Lineup data from{' '}
        <a
          href="https://www.glastonburyfestivals.co.uk/"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-fg"
        >
          glastonburyfestivals.co.uk
        </a>
        . Not affiliated with Glastonbury Festival.
      </footer>

      {!online && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-0 border-t border-border bg-surface-2 px-4 py-2 text-center text-xs text-muted"
        >
          Offline — showing cached data.
        </div>
      )}
    </div>
  );
};
