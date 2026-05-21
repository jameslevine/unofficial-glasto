import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { LineupPage } from '../features/lineup/LineupPage';
import { FavouritesPage } from '../features/lineup/FavouritesPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/lineup/2024" replace /> },
      { path: 'lineup/:year', element: <LineupPage /> },
      { path: 'favourites', element: <FavouritesPage /> },
      { path: '*', element: <Navigate to="/lineup/2024" replace /> },
    ],
  },
]);
