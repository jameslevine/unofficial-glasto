import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'glasto-auth-tokens';

export interface AuthTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const extra = Constants.expoConfig?.extra ?? {};

export const COGNITO_DOMAIN = extra.cognitoDomain as string | undefined;
export const COGNITO_CLIENT_ID = extra.cognitoClientId as string | undefined;
export const REDIRECT_SCHEME = 'glasto';

export const isAuthConfigured = () => Boolean(COGNITO_DOMAIN && COGNITO_CLIENT_ID);

export const discovery = COGNITO_DOMAIN
  ? {
      authorizationEndpoint: `${COGNITO_DOMAIN}/oauth2/authorize`,
      tokenEndpoint: `${COGNITO_DOMAIN}/oauth2/token`,
      revocationEndpoint: `${COGNITO_DOMAIN}/oauth2/revoke`,
      endSessionEndpoint: `${COGNITO_DOMAIN}/logout`,
    }
  : null;

let cached: AuthTokens | null | undefined;

export const getStoredTokens = async (): Promise<AuthTokens | null> => {
  if (cached !== undefined) {
    if (cached && cached.expiresAt > Date.now()) return cached;
    if (cached && cached.expiresAt <= Date.now()) cached = null;
    if (cached === null) return null;
  }
  try {
    const raw = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!raw) {
      cached = null;
      return null;
    }
    const tokens = JSON.parse(raw) as AuthTokens;
    if (tokens.expiresAt && tokens.expiresAt <= Date.now()) {
      cached = null;
      return null;
    }
    cached = tokens;
    return tokens;
  } catch {
    cached = null;
    return null;
  }
};

export const getIdToken = async (): Promise<string | null> => {
  const t = await getStoredTokens();
  return t?.idToken ?? null;
};

export const setTokens = async (tokens: AuthTokens): Promise<void> => {
  cached = tokens;
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
};

export const clearTokens = async (): Promise<void> => {
  cached = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};
