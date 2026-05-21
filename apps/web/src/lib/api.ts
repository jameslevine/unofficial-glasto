import { createApiClient } from '@glasto/shared';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

if (!baseUrl) {
  throw new Error('VITE_API_BASE_URL is not set. Define it in .env.local.');
}

export const api = createApiClient({ baseUrl: `${baseUrl}/v1` });
