'use client';

import type { User } from '@openfort/openfort-js';
import { useUser } from '@openfort/react';
import {
  exchangeOpenfortSession,
  getBackendMe,
  logoutBackendSession,
  refreshBackendSession,
  type BackendMeResponse,
} from '@/lib/backend-auth-client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type AppSessionStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error';

interface AuthSessionContextValue {
  status: AppSessionStatus;
  backendAccessToken: string | null;
  backendUser: BackendMeResponse | null;
  openfortUser: User | null;
  isOpenfortLoading: boolean;
  isOpenfortAuthenticated: boolean;
  error: string | null;
  retry: () => void;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Failed to initialize your session.';
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated, getAccessToken } = useUser();
  const openfortUserId = user?.id ?? null;
  const [status, setStatus] = useState<AppSessionStatus>('idle');
  const [backendAccessToken, setBackendAccessToken] = useState<string | null>(
    null
  );
  const [backendUser, setBackendUser] = useState<BackendMeResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const previousAuthState = useRef(false);

  const clearSession = useCallback(() => {
    setBackendAccessToken(null);
    setBackendUser(null);
    setError(null);
  }, []);

  const bootstrapSession = useCallback(async () => {
    if (!openfortUserId) {
      clearSession();
      setStatus('unauthenticated');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const loginResponse =
        (await refreshBackendSession().catch(() => null)) ??
        (await (async () => {
          const openfortAccessToken = await getAccessToken();

          if (!openfortAccessToken) {
            throw new Error('Openfort access token is unavailable.');
          }

          return exchangeOpenfortSession(openfortAccessToken);
        })());

      const me = await getBackendMe(loginResponse.access_token);

      setBackendAccessToken(loginResponse.access_token);
      setBackendUser(me);
      setStatus('authenticated');
    } catch (sessionError) {
      clearSession();
      setError(getErrorMessage(sessionError));
      setStatus('error');
    }
  }, [clearSession, getAccessToken, openfortUserId]);

  useEffect(() => {
    if (isLoading) {
      setStatus((currentStatus) =>
        currentStatus === 'authenticated' ? currentStatus : 'loading'
      );
      return;
    }

    if (!isAuthenticated || !openfortUserId) {
      clearSession();
      setStatus('unauthenticated');
      return;
    }

    void bootstrapSession();
  }, [
    bootstrapSession,
    clearSession,
    isAuthenticated,
    isLoading,
    openfortUserId,
    retryCount,
  ]);

  useEffect(() => {
    const signedOut =
      previousAuthState.current && !isLoading && !isAuthenticated;

    previousAuthState.current = isAuthenticated;

    if (!signedOut) {
      return;
    }

    clearSession();
    setStatus('unauthenticated');
    void logoutBackendSession().catch(() => undefined);
  }, [clearSession, isAuthenticated, isLoading]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      status,
      backendAccessToken,
      backendUser,
      openfortUser: user,
      isOpenfortLoading: isLoading,
      isOpenfortAuthenticated: isAuthenticated,
      error,
      retry: () => setRetryCount((count) => count + 1),
    }),
    [
      status,
      backendAccessToken,
      backendUser,
      user,
      isLoading,
      isAuthenticated,
      error,
    ]
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error(
      'useAuthSession must be used within an AuthSessionProvider.'
    );
  }

  return context;
}
