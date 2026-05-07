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

type AuthStepId =
  | 'signing_in'
  | 'checking_account'
  | 'restoring_session'
  | 'creating_account'
  | 'loading_profile'
  | 'connecting_wallet'
  | 'setting_up_wallet';

type AuthStepStatus = 'pending' | 'active' | 'done' | 'error';

export interface AuthProgressStep {
  id: AuthStepId;
  label: string;
  status: AuthStepStatus;
  errorMessage?: string;
}

interface AuthProgress {
  steps: AuthProgressStep[];
  isVisible: boolean;
}

const STEP_LABELS: Record<AuthStepId, string> = {
  signing_in: 'Authenticating with Openfort',
  checking_account: 'Checking your account',
  restoring_session: 'Restoring your session',
  creating_account: 'Creating your account',
  loading_profile: 'Loading your profile',
  connecting_wallet: 'Connecting your wallet',
  setting_up_wallet: 'Setting up your wallet',
};

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
  logout: () => Promise<void>;
  authProgress: AuthProgress | null;
  dismissProgress: () => void;
  cancelAuthFlow: () => Promise<void>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);
const ONBOARDING_STORAGE_KEY = 'infrafund:onboarding-draft';

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error) {
    return error;
  }

  if (error && typeof error === 'object') {
    if (
      'message' in error &&
      typeof error.message === 'string' &&
      error.message
    ) {
      return error.message;
    }

    try {
      return JSON.stringify(error);
    } catch {}
  }

  return 'Failed to initialize your session.';
}

function getUserFacingErrorMessage(message: string) {
  if (/failed to establish iFrame connection/i.test(message)) {
    return "We couldn't connect to the wallet service. Please check your connection and try again.";
  }

  if (
    /openfort shield rejected the wallet setup request|failed to create account or device|a_invalid|invalid token/i.test(
      message
    )
  ) {
    return 'Wallet setup is currently misconfigured on the server. Request Admin to check SHIELD env var settings; retrying will not fix it.';
  }

  if (
    /next_public_shield_api_key|shield_secret_key|shield_encryption_share/i.test(
      message
    )
  ) {
    return 'Wallet setup is unavailable because a required Openfort Shield configuration value is missing or invalid. Request Admin to check SHIELD env var settings.';
  }

  if (
    /user type is required|user role is required|organization name is required/i.test(
      message
    )
  ) {
    return `Account setup is missing required onboarding data. ${message}`;
  }

  if (/openfort access token is unavailable/i.test(message)) {
    return 'Your Openfort sign-in session is missing or expired. Please sign in again.';
  }

  if (
    /not logged in|session expired|invalid openfort access token/i.test(message)
  ) {
    return 'Your session expired. Please sign in again.';
  }

  if (/failed to fetch|networkerror/i.test(message)) {
    return 'We hit a network issue. Please try again.';
  }

  if (/internal server error/i.test(message)) {
    return 'Our service is temporarily unavailable. Please try again in a moment.';
  }

  if (message && message !== 'Failed to initialize your session.') {
    return message;
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
    walletStepId: 'connecting_wallet' | 'setting_up_wallet';
  } | null>(null);
  const previousAuthState = useRef(false);
  // Deduplication key: we only run one bootstrap per (userId, retryCount) pair.
  // This prevents the useEffect from re-triggering bootstrap when callbacks are
  // recreated due to dependency changes mid-flow.
  const bootstrapAttemptKeyRef = useRef<string | null>(null);
  const [authProgress, setAuthProgress] = useState<AuthProgress | null>(null);

  const setStepPlan = useCallback((stepIds: AuthStepId[]) => {
    setAuthProgress({
      isVisible: true,
      steps: stepIds.map((id) => ({
        id,
        label: STEP_LABELS[id],
        status: 'pending',
      })),
    });
  }, []);

  const updateStep = useCallback(
    (id: AuthStepId, patch: Partial<AuthProgressStep>) => {
      setAuthProgress((current) => {
        if (!current) return current;
        const steps = current.steps.map((step) =>
          step.id === id ? { ...step, ...patch } : step
        );
        return { ...current, steps };
      });
    },
    []
  );

  const startStep = useCallback(
    (id: AuthStepId) => {
      updateStep(id, { status: 'active', errorMessage: undefined });
    },
    [updateStep]
  );

  const completeStep = useCallback(
    (id: AuthStepId) => {
      updateStep(id, { status: 'done', errorMessage: undefined });
    },
    [updateStep]
  );

  const completeStepsThrough = useCallback((id: AuthStepId) => {
    setAuthProgress((current) => {
      if (!current) return current;
      let reached = false;
      const steps = current.steps.map((step) => {
        if (reached) return step;
        const next: AuthProgressStep = { ...step, status: 'done' };
        if (step.id === id) reached = true;
        return next;
      });
      return { ...current, steps };
    });
  }, []);

  const failStep = useCallback(
    (id: AuthStepId, errorMessage: string) => {
      updateStep(id, { status: 'error', errorMessage });
    },
    [updateStep]
  );

  const showProgress = useCallback(() => {
    setAuthProgress((current) =>
      current ? { ...current, isVisible: true } : current
    );
  }, []);

  const hideProgress = useCallback(() => {
    setAuthProgress((current) =>
      current ? { ...current, isVisible: false } : current
    );
  }, []);

  const clearProgress = useCallback(() => {
    setAuthProgress(null);
  }, []);

  const dismissProgress = useCallback(() => {
    setAuthProgress(null);
  }, []);

  const clearSession = useCallback(() => {
    setBackendAccessToken(null);
    setBackendUser(null);
    setPendingOnboardingAccessToken(null);
    setPendingWalletCreation(null);
    setError(null);
    setErrorCategory(null);
    setRetryCount(0);
    bootstrapAttemptKeyRef.current = null;
    clearOnboardingDraft();
    clearProgress();
  }, [clearProgress]);

  const cancelAuthFlow = useCallback(async () => {
    clearSession();
    setStatus('loading');

    await Promise.allSettled([
      logoutBackendSession().catch(() => undefined),
      signOut().catch(() => undefined),
    ]);

    clearSession();
    setStatus('unauthenticated');
  }, [clearSession, signOut]);

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
    async (
      accessToken: string,
      currentUser: BackendMeResponse,
      walletStepId: 'connecting_wallet' | 'setting_up_wallet'
    ) => {
      setBackendAccessToken(accessToken);
      setBackendUser(currentUser);
      setPendingWalletCreation({
        accessToken,
        user: currentUser,
        walletStepId,
      });
      setStatus('creating_wallet');
      // walletStepId is decided by the caller: 'connecting_wallet' for
      // returning users, 'setting_up_wallet' for new users post-questionnaire.
      // We can't decide here from wallets.length because the SDK's wallets[]
      // is populated asynchronously and may still be empty at this point even
      // for returning users.
      startStep(walletStepId);

      try {
        await create({
          recoveryMethod: RecoveryMethod.AUTOMATIC,
        });
        completeStep(walletStepId);
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
        const userMessage = commitUserFacingError(rawMessage);
        failStep(walletStepId, userMessage);
        setStatus('error');
      }
    },
    [
      baseReportExtras,
      commitUserFacingError,
      completeStep,
      create,
      failStep,
      finalizeAuthenticatedSession,
      startStep,
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

    // Single fixed-length plan covering the union of both returning-user
    // sub-paths. The cookie short-circuit (Path 1) skips checking_account by
    // marking it 'done' alongside signing_in. The exchange path (Path 2) walks
    // through it normally. The list never grows or shrinks mid-flight.
    setStepPlan([
      'signing_in',
      'checking_account',
      'restoring_session',
      'loading_profile',
      'connecting_wallet',
    ]);
    completeStep('signing_in');

    try {
      // Path 1: try to restore an existing app session via the refresh cookie.
      // This is the fast path for page reloads and returning sessions.
      // The cookie attempt is silent (no UI change) — typically resolves in
      // <50 ms. Showing a spinner for it would tick step 3 active before
      // step 2, which looks out-of-order.
      const refreshedSession = await refreshBackendSession().catch(() => null);

      if (refreshedSession) {
        try {
          // Cookie path succeeded. Tick steps 2 and 3 in order: the cookie
          // makes both 'checking_account' (we know who you are) and
          // 'restoring_session' (your session is restored) effectively true.
          completeStep('checking_account');
          completeStep('restoring_session');
          startStep('loading_profile');
          const me = await getBackendMe(refreshedSession.access_token);
          completeStep('loading_profile');
          // Route through createWalletIfNeeded (not finalizeAuthenticatedSession
          // directly) so the embedded-wallet iframe is loaded and the wallet
          // becomes usable for signing — even on session restore.
          await createWalletIfNeeded(
            refreshedSession.access_token,
            me,
            'connecting_wallet'
          );
          return;
        } catch {
          // Refresh token was valid but user is inaccessible (e.g. soft-deleted).
          // Clear the stale cookie and fall through to Openfort re-auth. Reset
          // the steps we already ticked in the cookie branch so the exchange
          // path can re-walk them in order.
          await logoutBackendSession().catch(() => undefined);
          updateStep('checking_account', { status: 'pending' });
          updateStep('restoring_session', { status: 'pending' });
          updateStep('loading_profile', { status: 'pending' });
        }
      }

      // Paths 2 & 3: no valid refresh cookie; re-authenticate via Openfort token.
      startStep('checking_account');
      const openfortAccessToken = await getAccessToken();

      if (!openfortAccessToken) {
        throw new Error('Openfort access token is unavailable.');
      }

      const checkResponse = await checkOpenfortUser(openfortAccessToken);
      completeStep('checking_account');

      if (!checkResponse.exists) {
        // Path 3: new user — hold the Openfort token and show the qualification
        // questionnaire. Wallet creation is deferred to completeOnboarding().
        // Hide the progress modal so the questionnaire is the only surface.
        closeOpenfortModal();
        setPendingOnboardingAccessToken(openfortAccessToken);
        hideProgress();
        setStatus('needs_onboarding');
        return;
      }

      // Path 2: existing user — exchange the Openfort token for an app session.
      startStep('restoring_session');
      const loginResponse = await exchangeOpenfortSession(openfortAccessToken);
      completeStep('restoring_session');

      startStep('loading_profile');
      const me = await getBackendMe(loginResponse.access_token);
      completeStep('loading_profile');

      await createWalletIfNeeded(
        loginResponse.access_token,
        me,
        'connecting_wallet'
      );
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
      const userMessage = commitUserFacingError(getErrorMessage(sessionError));
      // Mark the currently-active step as failed so the modal points at the
      // step that broke. If nothing is active (shouldn't happen), this no-ops.
      setAuthProgress((current) => {
        if (!current) return current;
        const activeStep = current.steps.find((s) => s.status === 'active');
        if (!activeStep) return current;
        const steps = current.steps.map((s) =>
          s.id === activeStep.id
            ? {
                ...s,
                status: 'error' as AuthStepStatus,
                errorMessage: userMessage,
              }
            : s
        );
        return { ...current, steps };
      });
      setStatus('error');
    }
  }, [
    baseReportExtras,
    clearSession,
    closeOpenfortModal,
    commitUserFacingError,
    completeStep,
    createWalletIfNeeded,
    getAccessToken,
    hideProgress,
    openfortUserId,
    setStepPlan,
    startStep,
    updateStep,
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

      // New-user post-questionnaire plan. signing_in and checking_account were
      // already completed during bootstrapSession; mark them done up front and
      // bring the progress modal back into view.
      setStepPlan([
        'signing_in',
        'checking_account',
        'creating_account',
        'loading_profile',
        'setting_up_wallet',
      ]);
      completeStepsThrough('checking_account');
      showProgress();

      try {
        startStep('creating_account');
        const loginResponse = await exchangeOpenfortSession(
          pendingOnboardingAccessToken,
          {
            role,
            type,
            organization_name:
              type === 'organization' ? organizationName?.trim() : undefined,
          }
        );
        completeStep('creating_account');

        startStep('loading_profile');
        const me = await getBackendMe(loginResponse.access_token);
        completeStep('loading_profile');

        await createWalletIfNeeded(
          loginResponse.access_token,
          me,
          'setting_up_wallet'
        );
      } catch (sessionError) {
        reportError(sessionError, {
          area: 'auth',
          tags: { stage: 'onboarding' },
          extra: baseReportExtras(),
        });
        const userMessage = commitUserFacingError(
          getErrorMessage(sessionError)
        );
        setAuthProgress((current) => {
          if (!current) return current;
          const activeStep = current.steps.find((s) => s.status === 'active');
          if (!activeStep) return current;
          const steps = current.steps.map((s) =>
            s.id === activeStep.id
              ? {
                  ...s,
                  status: 'error' as AuthStepStatus,
                  errorMessage: userMessage,
                }
              : s
          );
          return { ...current, steps };
        });
        setStatus('needs_onboarding');
      }
    },
    [
      baseReportExtras,
      commitUserFacingError,
      completeStep,
      completeStepsThrough,
      createWalletIfNeeded,
      pendingOnboardingAccessToken,
      setStepPlan,
      showProgress,
      startStep,
    ]
  );

  const abandonOnboarding = useCallback(async () => {
    await cancelAuthFlow();
  }, [cancelAuthFlow]);

  const logout = useCallback(async () => {
    setStatus('loading');
    setError(null);

    await Promise.allSettled([
      logoutBackendSession().catch(() => undefined),
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
        pendingWalletCreation.user,
        pendingWalletCreation.walletStepId
      );
      return;
    }

    setRetryCount((count) => count + 1);
  }, [createWalletIfNeeded, pendingWalletCreation]);

  // OAuth callback pre-emptive cover: when Openfort's redirect-based OAuth
  // returns the user to our app at `/?openfortAuthProviderUI=…`, the SDK's
  // ConnectModal auto-detects those params and reopens itself to run
  // ConnectWithOAuth (which calls storeCredentials). That UI flashes for a
  // few hundred ms before our bootstrap useEffect can run and close the
  // Openfort modal. Seeding authProgress here makes the task-103 modal
  // (z-[10001]) appear immediately on page load and cover the Openfort
  // ConnectWithOAuth page underneath. The signing_in step gets re-marked
  // done when bootstrapSession runs and overwrites the plan.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.location.search.includes('openfortAuthProviderUI')) return;
    setStepPlan([
      'signing_in',
      'checking_account',
      'restoring_session',
      'loading_profile',
      'connecting_wallet',
    ]);
    startStep('signing_in');
    // Eagerly close the Openfort modal too — defensive, since the SDK reopens
    // it on URL detection. Our bootstrap useEffect would do this once
    // isAuthenticated flips, but doing it here closes the gap.
    closeOpenfortModal();
    // Mount-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // Close the Openfort built-in modal immediately. Without this, the SDK's
    // CONNECTED page (the "Connected — Manage wallets" popup) stays visible
    // until finalizeAuthenticatedSession runs at the end of the bootstrap.
    closeOpenfortModal();

    void bootstrapSession();
  }, [
    bootstrapSession,
    clearSession,
    closeOpenfortModal,
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
      logout,
      authProgress,
      dismissProgress,
      cancelAuthFlow,
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
      logout,
      authProgress,
      dismissProgress,
      cancelAuthFlow,
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
