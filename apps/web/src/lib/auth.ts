const DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN as string | undefined;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined;
const getRedirectUri = () => `${window.location.origin}/auth/callback`;

const TOKEN_KEY = 'glasto-auth-tokens';
const VERIFIER_KEY = 'glasto-pkce-verifier';
const RETURN_KEY = 'glasto-auth-return';

export interface AuthTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export const isAuthConfigured = () => Boolean(DOMAIN && CLIENT_ID);

const base64Url = (bytes: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const randomVerifier = () => {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return base64Url(bytes.buffer);
};

const sha256 = async (input: string) => {
  const data = new TextEncoder().encode(input);
  return base64Url(await crypto.subtle.digest('SHA-256', data));
};

export const getStoredTokens = (): AuthTokens | null => {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const tokens = JSON.parse(raw) as AuthTokens;
    if (tokens.expiresAt && tokens.expiresAt <= Date.now()) return null;
    return tokens;
  } catch {
    return null;
  }
};

export const getIdToken = (): string | null => getStoredTokens()?.idToken ?? null;

const setTokens = (tokens: AuthTokens) => {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const beginSignIn = async (returnTo?: string) => {
  if (!isAuthConfigured()) throw new Error('Auth env vars missing');
  const verifier = randomVerifier();
  const challenge = await sha256(verifier);
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  if (returnTo) sessionStorage.setItem(RETURN_KEY, returnTo);
  const url = new URL(`${DOMAIN}/oauth2/authorize`);
  url.searchParams.set('client_id', CLIENT_ID!);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'email openid profile');
  url.searchParams.set('redirect_uri', getRedirectUri());
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('code_challenge', challenge);
  window.location.assign(url.toString());
};

export const exchangeCodeForTokens = async (code: string): Promise<AuthTokens> => {
  if (!isAuthConfigured()) throw new Error('Auth env vars missing');
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error('Missing PKCE verifier — start sign-in again');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID!,
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier,
  });

  const res = await fetch(`${DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    id_token: string;
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const tokens: AuthTokens = {
    idToken: json.id_token,
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };

  sessionStorage.removeItem(VERIFIER_KEY);
  setTokens(tokens);
  return tokens;
};

export const consumeReturnTo = (): string => {
  const v = sessionStorage.getItem(RETURN_KEY);
  sessionStorage.removeItem(RETURN_KEY);
  return v ?? '/';
};

export const signOut = () => {
  clearTokens();
  if (!isAuthConfigured()) {
    window.location.assign('/');
    return;
  }
  const url = new URL(`${DOMAIN}/logout`);
  url.searchParams.set('client_id', CLIENT_ID!);
  url.searchParams.set('logout_uri', window.location.origin + '/');
  window.location.assign(url.toString());
};
