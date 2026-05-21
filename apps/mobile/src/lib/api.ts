import Constants from 'expo-constants';
import { createApiClient } from '@glasto/shared';

const baseUrl = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
if (!baseUrl) {
  throw new Error('apiBaseUrl missing from app.json extra');
}

export const api = createApiClient({ baseUrl: `${baseUrl}/v1` });
