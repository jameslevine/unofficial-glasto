import { registerSW } from 'virtual:pwa-register';

export const registerServiceWorker = () => {
  if (import.meta.env.DEV) return;
  registerSW({ immediate: true });
};
