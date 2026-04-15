'use client';

import type { User } from '@openfort/openfort-js';
import { RecoveryMethod, useSignOut, useUI, useUser } from '@openfort/react';
import { useEthereumEmbeddedWallet } from '@openfort/react/ethereum';
import {
  checkOpenfortUser,
  deleteBackendAccount,
  exchangeOpenfortSession,
  getBackendMe,
  logoutBackendSession,
  refreshBackendSession,
  type BackendMeResponse,
} from '@/lib/backend-auth-client';
import {
  QualificationQuestionnaire,
  type QualificationSubmission,
} from './qualification-questionnaire';
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
  | 'needs_onboarding'
  | 'creating_wallet'
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
  deleteAccount: () => Promise<void>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);
const ONBOARDING_STORAGE_KEY = 'infrafund:onboarding-draft';

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Failed to initialize your session.';
}

function clearOnboardingDraft() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);
  }
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated, getAccessToken } = useUser();
  const { signOut } = useSignOut();
  const { close: closeOpenfortModal } = useUI();
  const { create, wallets } = useEthereumEmbeddedWallet();
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
  const [pendingOnboardingAccessToken, setPendingOnboardingAccessToken] =
    useState<string | null>(null);
  const [pendingWalletCreation, setPendingWalletCreation] = useState<{
    accessToken: string;
    user: BackendMeResponse;
  } | null>(null);
  const previousAuthState = useRef(false);
  const bootstrapAttemptKeyRef = useRef<string | null>(null);

  const clearSession = useCallback(() => {
    setBackendAccessToken(null);
    setBackendUser(null);
    setPendingOnboardingAccessToken(null);
    setPendingWalletCreation(null);
    setError(null);
    bootstrapAttemptKeyRef.current = null;
    clearOnboardingDraft();
  }, []);

  const finalizeAuthenticatedSession = useCallback(
    (accessToken: string, currentUser: BackendMeResponse) => {
      closeOpenfortModal();
      setBackendAccessToken(accessToken);
      setBackendUser(currentUser);
      setPendingOnboardingAccessToken(null);
      setPendingWalletCreation(null);
      setError(null);
      clearOnboardingDraft();
      setStatus('authenticated');
    },
    [closeOpenfortModal]
  );

  const createWalletIfNeeded = useCallback(
    async (accessToken: string, currentUser: BackendMeResponse) => {
      setBackendAccessToken(accessToken);
      setBackendUser(currentUser);
      setPendingWalletCreation({ accessToken, user: currentUser });

      if (wallets.length > 0) {
        console.info('[AuthSession] Wallet already exists, skipping creation.');
        finalizeAuthenticatedSession(accessToken, currentUser);
        return;
      }

      setStatus('creating_wallet');

      try {
        await create({
          recoveryMethod: RecoveryMethod.AUTOMATIC,
        });
        finalizeAuthenticatedSession(accessToken, currentUser);
      } catch (walletError) {
        const message = getErrorMessage(walletError);
        if (/already exists|duplicate/i.test(message)) {
          console.warn(
            '[AuthSession] Possible duplicate wallet creation attempt.',
            { error: message }
          );
        }
        setError(message);
        setStatus('error');
      }
    },
    [create, finalizeAuthenticatedSession, wallets.length]
  );

  const bootstrapSession = useCallback(async () => {
    if (!openfortUserId) {
      clearSession();
      setStatus('unauthenticated');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const refreshedSession = await refreshBackendSession().catch(() => null);

      if (refreshedSession) {
        try {
          const me = await getBackendMe(refreshedSession.access_token);
          finalizeAuthenticatedSession(refreshedSession.access_token, me);
          return;
        } catch {
          // Refresh token was valid but user is inaccessible (e.g. soft-deleted).
          // Clear the stale cookie and fall through to Openfort re-auth.
          await logoutBackendSession().catch(() => undefined);
        }
      }

      const openfortAccessToken = await getAccessToken();

      if (!openfortAccessToken) {
        throw new Error('Openfort access token is unavailable.');
      }

      const checkResponse = await checkOpenfortUser(openfortAccessToken);

      if (!checkResponse.exists) {
        closeOpenfortModal();
        setPendingOnboardingAccessToken(openfortAccessToken);
        setStatus('needs_onboarding');
        return;
      }

      const loginResponse = await exchangeOpenfortSession(openfortAccessToken);
      const me = await getBackendMe(loginResponse.access_token);

      finalizeAuthenticatedSession(loginResponse.access_token, me);
    } catch (sessionError) {
      setBackendAccessToken(null);
      setBackendUser(null);
      setPendingOnboardingAccessToken(null);
      setPendingWalletCreation(null);
      setError(getErrorMessage(sessionError));
      setStatus('error');
    }
  }, [
    clearSession,
    closeOpenfortModal,
    finalizeAuthenticatedSession,
    getAccessToken,
    openfortUserId,
  ]);

  const completeOnboarding = useCallback(
    async ({ role, type, organizationName }: QualificationSubmission) => {
      if (!pendingOnboardingAccessToken) {
        setError('Openfort access token is unavailable.');
        setStatus('error');
        return;
      }

      setStatus('loading');
      setError(null);

      try {
        const loginResponse = await exchangeOpenfortSession(
          pendingOnboardingAccessToken,
          {
            role,
            type,
            organization_name:
              type === 'organization' ? organizationName?.trim() : undefined,
          }
        );
        const me = await getBackendMe(loginResponse.access_token);

        await createWalletIfNeeded(loginResponse.access_token, me);
      } catch (sessionError) {
        setError(getErrorMessage(sessionError));
        setStatus('needs_onboarding');
      }
    },
    [createWalletIfNeeded, pendingOnboardingAccessToken]
  );

  const abandonOnboarding = useCallback(async () => {
    clearSession();
    setStatus('loading');

    await Promise.allSettled([
      logoutBackendSession(),
      signOut().catch(() => undefined),
    ]);

    clearSession();
    setStatus('unauthenticated');
  }, [clearSession, signOut]);

  const deleteAccount = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      if (backendAccessToken) {
        await deleteBackendAccount(backendAccessToken);
      }
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
      setStatus('authenticated');
      return;
    }

    await Promise.allSettled([
      logoutBackendSession().catch(() => undefined),
      signOut().catch(() => undefined),
    ]);

    clearSession();
    setStatus('unauthenticated');
  }, [backendAccessToken, clearSession, signOut]);

  const retry = useCallback(() => {
    if (pendingWalletCreation) {
      void createWalletIfNeeded(
        pendingWalletCreation.accessToken,
        pendingWalletCreation.user
      );
      return;
    }

    setRetryCount((count) => count + 1);
  }, [createWalletIfNeeded, pendingWalletCreation]);

  useEffect(() => {
    if (isLoading) {
      setStatus((currentStatus) =>
        currentStatus === 'authenticated' ||
        currentStatus === 'needs_onboarding'
          ? currentStatus
          : 'loading'
      );
      return;
    }

    if (!isAuthenticated || !openfortUserId) {
      clearSession();
      setStatus('unauthenticated');
      return;
    }

    const bootstrapAttemptKey = `${openfortUserId}:${retryCount}`;

    if (bootstrapAttemptKeyRef.current === bootstrapAttemptKey) {
      return;
    }

    bootstrapAttemptKeyRef.current = bootstrapAttemptKey;

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
      retry,
      deleteAccount,
    }),
    [
      status,
      backendAccessToken,
      backendUser,
      user,
      isLoading,
      isAuthenticated,
      error,
      retry,
      deleteAccount,
    ]
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
      <QualificationQuestionnaire
        isOpen={status === 'needs_onboarding'}
        openfortUser={user}
        submitError={error}
        isSubmitting={status === 'loading'}
        onClose={() => {
          void abandonOnboarding();
        }}
        onSubmit={completeOnboarding}
        onDisqualifiedSuccess={abandonOnboarding}
      />
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
