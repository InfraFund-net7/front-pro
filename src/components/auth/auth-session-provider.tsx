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
import { usePathname } from 'next/navigation';
import { reportError } from '@/lib/error-reporting';

type AppSessionStatus =
  | 'idle'
  | 'loading'
  | 'needs_onboarding'
  | 'creating_wallet'
  | 'authenticated'
  | 'unauthenticated'
  | 'error';

type ErrorCategory = 'recoverable' | 'fatal';

interface AuthSessionContextValue {
  status: AppSessionStatus;
  backendAccessToken: string | null;
  backendUser: BackendMeResponse | null;
  openfortUser: User | null;
  isOpenfortLoading: boolean;
  isOpenfortAuthenticated: boolean;
  error: string | null;
  errorCategory: ErrorCategory | null;
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

function getUserFacingErrorMessage(message: string) {
  if (/failed to establish iFrame connection/i.test(message)) {
    return "We couldn't connect to the wallet service. Please check your connection and try again.";
  }

  if (/not logged in|session/i.test(message)) {
    return 'Your session expired. Please sign in again.';
  }

  if (/failed to fetch|networkerror/i.test(message)) {
    return 'We hit a network issue. Please try again.';
  }

  return 'Something went wrong. Please try again.';
}

function classifyError(message: string): ErrorCategory {
  if (
    /failed to fetch|networkerror|failed to establish iframe|timeout|temporarily|try again/i.test(
      message
    )
  ) {
    return 'recoverable';
  }

  return 'fatal';
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
  const [errorCategory, setErrorCategory] = useState<ErrorCategory | null>(
    null
  );
  const [retryCount, setRetryCount] = useState(0);
  const pathname = usePathname();
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
    setErrorCategory(null);
    bootstrapAttemptKeyRef.current = null;
    clearOnboardingDraft();
  }, []);

  const commitUserFacingError = useCallback((raw: string) => {
    const userMessage = getUserFacingErrorMessage(raw);
    setError(userMessage);
    setErrorCategory(classifyError(raw));
    return userMessage;
  }, []);

  const baseReportExtras = useCallback(
    () => ({
      route: pathname ?? null,
      retryCount,
      openfortUserId: openfortUserId ? openfortUserId.slice(-6) : null,
    }),
    [openfortUserId, pathname, retryCount]
  );

  const finalizeAuthenticatedSession = useCallback(
    (accessToken: string, currentUser: BackendMeResponse) => {
      closeOpenfortModal();
      setBackendAccessToken(accessToken);
      setBackendUser(currentUser);
      setPendingOnboardingAccessToken(null);
      setPendingWalletCreation(null);
      setError(null);
      setErrorCategory(null);
      clearOnboardingDraft();
      setStatus('authenticated');
    },
    [closeOpenfortModal]
  );

  // NOTE: On every login, the OpenFort SDK's useAutoRecovery hook fires in
  // the EMBEDDED_SIGNER_NOT_CONFIGURED state and attempts to recover the
  // Shield share via the Shield API.  This recovery call fails with
  // NoSecretFoundError on EVERY login (not just first login), producing
  // console errors:
  //   GET shield.openfort.io/shares/<ref>   → 400
  //   GET shield.openfort.io/shares          → 404
  //   [ERROR] failed to retrieve secret  NoSecretFoundError
  //   [ERROR] Recover failed               NoSecretFoundError
  //
  // Root cause: The iframe's recover() path calls ShieldSDK.getSecret() which
  // returns 404 — the Shield API cannot find a stored share for the user's
  // current auth context.  This appears to be a bug in the Shield / iframe
  // recovery flow (@openfort/react 1.0.12, @openfort/shield-js 0.1.36,
  // iframe v0.4.50).  See https://github.com/openfort-xyz/openfort-js/issues/272
  //
  // Impact: The wallet still functions on the same device because the iframe
  // independently recovers the private key from its own persistent storage
  // (IndexedDB in the iframe origin).  However, the useEthereumEmbeddedWallet
  // hook remains in "disconnected" state (embeddedState stays
  // NOT_CONFIGURED) until the iframe self-recovers, meaning provider is null
  // and any signing call would fail during that window.  Cross-device or
  // post-clear-storage recovery is likely broken until the upstream issue is
  // resolved.
  //
  // Current app status: No code currently calls signing methods, so the
  // errors are noise-only.  When on-chain features are added, this must be
  // re-evaluated — the provider from useEthereumEmbeddedWallet must be
  // confirmed as non-null before any signing attempt.
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
        const rawMessage = getErrorMessage(walletError);
        reportError(walletError, {
          area: 'wallet',
          tags: { stage: 'create' },
          extra: {
            ...baseReportExtras(),
            hasExistingWallet: wallets.length > 0,
          },
        });
        if (/already exists|duplicate/i.test(rawMessage)) {
          console.warn(
            '[AuthSession] Possible duplicate wallet creation attempt.',
            { error: rawMessage }
          );
        }
        commitUserFacingError(rawMessage);
        setStatus('error');
      }
    },
    [
      baseReportExtras,
      commitUserFacingError,
      create,
      finalizeAuthenticatedSession,
      wallets.length,
    ]
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
      reportError(sessionError, {
        area: 'auth',
        tags: { stage: 'bootstrap' },
        extra: baseReportExtras(),
      });
      setBackendAccessToken(null);
      setBackendUser(null);
      setPendingOnboardingAccessToken(null);
      setPendingWalletCreation(null);
      commitUserFacingError(getErrorMessage(sessionError));
      setStatus('error');
    }
  }, [
    baseReportExtras,
    clearSession,
    closeOpenfortModal,
    commitUserFacingError,
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
        reportError(sessionError, {
          area: 'auth',
          tags: { stage: 'onboarding' },
          extra: baseReportExtras(),
        });
        commitUserFacingError(getErrorMessage(sessionError));
        setStatus('needs_onboarding');
      }
    },
    [
      baseReportExtras,
      commitUserFacingError,
      createWalletIfNeeded,
      pendingOnboardingAccessToken,
    ]
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
      reportError(deleteError, {
        area: 'auth',
        tags: { stage: 'delete-account' },
        extra: baseReportExtras(),
      });
      commitUserFacingError(getErrorMessage(deleteError));
      setStatus('authenticated');
      return;
    }

    await Promise.allSettled([
      logoutBackendSession().catch(() => undefined),
      signOut().catch(() => undefined),
    ]);

    clearSession();
    setStatus('unauthenticated');
  }, [
    backendAccessToken,
    baseReportExtras,
    clearSession,
    commitUserFacingError,
    signOut,
  ]);

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
      errorCategory,
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
      errorCategory,
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
