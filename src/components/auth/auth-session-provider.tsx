'use client';

// AuthSessionProvider bridges Openfort identity with our app session.
//
// Design: Openfort owns auth (Google/Email OTP) and wallets. We own the app
// session (JWT + httpOnly refresh cookie), user profile, and the qualification
// gate. connectOnLogin: false means Openfort never auto-connects the wallet —
// we call create() explicitly at the right moment.
//
// Status machine:
//   idle → loading → needs_onboarding → loading → creating_wallet → authenticated
//                 ↘ creating_wallet → authenticated   (existing user)
//                 ↘ error                             (any failure)
//
// New-user path (registration):
//   Openfort auth → check backend (exists: false) → qualification questionnaire
//   → backend exchange with role/type → createWalletIfNeeded → authenticated
//
// Existing-user path (login):
//   Openfort auth → refresh cookie valid? → getBackendMe → createWalletIfNeeded
//                                        ↘ no cookie → check backend (exists: true)
//                                          → backend exchange → createWalletIfNeeded
//
// createWalletIfNeeded always calls Openfort's create() to load the iframe and
// establish the embedded-wallet connection. For new users create() provisions
// the wallet; for returning users it reconnects to the existing one. Skipping
// this step for returning users leaves the wallet in [Not connected] state
// because the embedded-wallet iframe is never loaded (connectOnLogin: false).

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
  // Deduplication key: we only run one bootstrap per (userId, retryCount) pair.
  // This prevents the useEffect from re-triggering bootstrap when callbacks are
  // recreated due to dependency changes mid-flow.
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

  // Terminal success state: app session is fully established and the wallet
  // iframe is connected. Closes any Openfort modal still visible and resets
  // all transient state accumulated during the auth/onboarding flow.
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

  // Loads the Openfort embedded-wallet iframe and connects/creates the wallet,
  // then transitions to authenticated.
  //
  // Context when called: the backend session is already established (accessToken
  // and currentUser are valid). The Openfort SDK is authenticated. The only
  // remaining step is to load the hidden iframe so the wallet is usable.
  //
  // Why always call create(): connectOnLogin: false means the SDK never loads
  // the iframe automatically. create() is the correct call for both paths:
  //   - New user:      provisions the wallet and connects it via the iframe.
  //   - Existing user: reconnects to the existing wallet via the iframe.
  //                    The SDK's wallets[] array may already contain the wallet
  //                    (fetched from the Openfort API), but that does not mean
  //                    the iframe is loaded — without it the wallet is [Not
  //                    connected] and cannot sign transactions. Skipping create()
  //                    when wallets.length > 0 was the original bug causing
  //                    returning users to see [Not connected] on every login.
  const createWalletIfNeeded = useCallback(
    async (accessToken: string, currentUser: BackendMeResponse) => {
      setBackendAccessToken(accessToken);
      setBackendUser(currentUser);
      setPendingWalletCreation({ accessToken, user: currentUser });
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

  // Runs once per Openfort user identity (keyed on openfortUserId + retryCount).
  // Determines which path the user takes and drives them to createWalletIfNeeded.
  //
  // Priority order:
  //   1. Valid refresh cookie → restore the app session directly, skip Openfort
  //      token exchange (faster; avoids an extra round-trip to Openfort API).
  //   2. No refresh cookie, existing backend user → exchange Openfort token for
  //      app session.
  //   3. No backend user → show qualification questionnaire; wallet creation is
  //      deferred until completeOnboarding() succeeds.
  const bootstrapSession = useCallback(async () => {
    if (!openfortUserId) {
      clearSession();
      setStatus('unauthenticated');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      // Path 1: try to restore an existing app session via the refresh cookie.
      // This is the fast path for page reloads and returning sessions.
      const refreshedSession = await refreshBackendSession().catch(() => null);

      if (refreshedSession) {
        try {
          const me = await getBackendMe(refreshedSession.access_token);
          // Route through createWalletIfNeeded (not finalizeAuthenticatedSession
          // directly) so the embedded-wallet iframe is loaded and the wallet
          // becomes usable for signing — even on session restore.
          await createWalletIfNeeded(refreshedSession.access_token, me);
          return;
        } catch {
          // Refresh token was valid but user is inaccessible (e.g. soft-deleted).
          // Clear the stale cookie and fall through to Openfort re-auth.
          await logoutBackendSession().catch(() => undefined);
        }
      }

      // Paths 2 & 3: no valid refresh cookie; re-authenticate via Openfort token.
      const openfortAccessToken = await getAccessToken();

      if (!openfortAccessToken) {
        throw new Error('Openfort access token is unavailable.');
      }

      const checkResponse = await checkOpenfortUser(openfortAccessToken);

      if (!checkResponse.exists) {
        // Path 3: new user — hold the Openfort token and show the qualification
        // questionnaire. Wallet creation is deferred to completeOnboarding().
        closeOpenfortModal();
        setPendingOnboardingAccessToken(openfortAccessToken);
        setStatus('needs_onboarding');
        return;
      }

      // Path 2: existing user — exchange the Openfort token for an app session.
      const loginResponse = await exchangeOpenfortSession(openfortAccessToken);
      const me = await getBackendMe(loginResponse.access_token);

      await createWalletIfNeeded(loginResponse.access_token, me);
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
    createWalletIfNeeded,
    getAccessToken,
    openfortUserId,
  ]);

  // Called when the user submits the qualification questionnaire.
  // Context: status === 'needs_onboarding', pendingOnboardingAccessToken is set.
  // The Openfort token is still valid; no app session exists yet.
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

  // Primary driver: react to Openfort auth state changes.
  // bootstrapAttemptKey deduplicate calls so we run bootstrap exactly once
  // per (user, retryCount) pair, even when the effect re-fires because a
  // callback was recreated due to dependency changes mid-flow.
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

  // Secondary driver: detect explicit sign-out. Openfort's own sign-out does
  // not call our logout endpoint, so we must revoke the app session cookie here.
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
