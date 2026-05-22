import { useCallback, useEffect, useRef, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  COGNITO_CLIENT_ID,
  COGNITO_DOMAIN,
  REDIRECT_SCHEME,
  clearTokens,
  discovery,
  getStoredTokens,
  isAuthConfigured,
  setTokens,
  type AuthTokens,
} from '../lib/auth';

WebBrowser.maybeCompleteAuthSession();

const SCOPES = ['email', 'openid', 'profile'];

const redirectUri = AuthSession.makeRedirectUri({
  scheme: REDIRECT_SCHEME,
  path: 'auth/callback',
});

export interface CognitoAuth {
  signedIn: boolean;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useCognitoAuth = (): CognitoAuth => {
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const ready = useRef(false);

  useEffect(() => {
    if (!isAuthConfigured()) return;
    getStoredTokens().then((t) => {
      setSignedIn(Boolean(t));
      ready.current = true;
    });
  }, []);

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: COGNITO_CLIENT_ID ?? '',
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery,
  );

  const signIn = useCallback(async () => {
    if (!isAuthConfigured() || !discovery || !request) return;
    setLoading(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success' || !result.params.code) return;

      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId: COGNITO_CLIENT_ID ?? '',
          code: result.params.code,
          redirectUri,
          extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
        },
        discovery,
      );

      const tokens: AuthTokens = {
        idToken: tokenResult.idToken ?? '',
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken ?? '',
        expiresAt: Date.now() + (tokenResult.expiresIn ?? 3600) * 1000,
      };
      await setTokens(tokens);
      setSignedIn(true);
    } finally {
      setLoading(false);
    }
  }, [promptAsync, request]);

  const signOut = useCallback(async () => {
    await clearTokens();
    setSignedIn(false);
    if (COGNITO_DOMAIN && COGNITO_CLIENT_ID) {
      const url = `${COGNITO_DOMAIN}/logout?client_id=${encodeURIComponent(
        COGNITO_CLIENT_ID,
      )}&logout_uri=${encodeURIComponent(redirectUri)}`;
      await WebBrowser.openAuthSessionAsync(url, redirectUri);
    }
  }, []);

  return { signedIn, loading, signIn, signOut };
};
