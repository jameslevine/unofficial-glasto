import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router';
import { AppProviders } from './lib/providers';
import { registerServiceWorker } from './lib/pwa';
import './styles/index.css';

registerServiceWorker();

const root = document.getElementById('root');
if (!root) throw new Error('root element missing');

createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
