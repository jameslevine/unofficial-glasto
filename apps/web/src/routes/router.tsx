import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { LineupPage } from '../features/lineup/LineupPage';
import { FavouritesPage } from '../features/lineup/FavouritesPage';
import { ArtistPage } from '../features/artists/ArtistPage';

const MapPage = lazy(() => import('../features/map/MapPage').then((m) => ({ default: m.MapPage })));

const MapRoute = () => (
  <Suspense fallback={<p className="text-muted">Loading map…</p>}>
    <MapPage />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/lineup/2024" replace /> },
      { path: 'lineup/:year', element: <LineupPage /> },
      { path: 'favourites', element: <FavouritesPage /> },
      { path: 'artists/:slug', element: <ArtistPage /> },
      { path: 'map', element: <MapRoute /> },
      { path: '*', element: <Navigate to="/lineup/2024" replace /> },
    ],
  },
]);
