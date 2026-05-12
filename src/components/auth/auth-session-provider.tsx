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
import {
  RecoveryMethod,
  useOpenfortCore,
  useUI,
  useUser,
} from '@openfort/react';
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

const OPENFORT_CALLBACK_PARAMS = [
  'openfortAuthProviderUI',
  'access_token',
  'user_id',
  'error',
] as const;

function stripOpenfortCallbackParams() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  let mutated = false;
  for (const key of OPENFORT_CALLBACK_PARAMS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      mutated = true;
    }
  }
  if (mutated) {
    window.history.replaceState({}, document.title, url.toString());
  }
}

// Hard-navigate to the public landing page. Using window.location.assign
// (instead of router.replace) forces a full document reload, which is the
// canonical Openfort disconnect pattern (see docs: useSignOut + onSignOutSuccess
// → window.location.href = "/"). Soft navigation leaves OpenfortProvider and
// ConnectModal mounted, so any leftover OAuth callback params or in-memory
// SDK state can re-arm the auth flow before the next mount.
function hardNavigateToRoot() {
  if (typeof window === 'undefined') return;
  stripOpenfortCallbackParams();
  if (window.location.pathname === '/') {
    window.location.reload();
  } else {
    window.location.assign('/');
  }
}

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
  // We call logout() from useOpenfortCore (not useSignOut) because the latter
  // dispatches logout() without awaiting it (see SDK source for useSignOut),
  // so its returned promise resolves before openfort.auth.logout() actually
  // clears the SDK's storage. We need to fully await the clear before doing
  // the hard reload, otherwise OpenfortProvider re-mounts from still-populated
  // storage and the user gets bounced straight back through the auth flow.
  const { logout: openfortLogout } = useOpenfortCore();
  const { close: closeOpenfortModal } = useUI();
  const { create, wallets } = useEthereumEmbeddedWallet();
  const openfortUserId = user?.id ?? null;
  // Set when any disconnect path starts so the secondary "signedOut" useEffect
  // does not double-fire its own backend revocation + navigation. Both
  // entry points (avatar-menu logout, Openfort built-in modal disconnect)
  // ultimately drop isAuthenticated, but only the entry point that ran
  // first should drive the cleanup + hard reload.
  const logoutInProgressRef = useRef(false);
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
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;
    clearSession();
    setStatus('loading');

    await logoutBackendSession().catch(() => undefined);
    await openfortLogout().catch(() => undefined);

    hardNavigateToRoot();
  }, [clearSession, openfortLogout]);

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
  const connectWallet = useCallback(async () => {
    await create({
      recoveryMethod: RecoveryMethod.AUTOMATIC,
    });
  }, [create]);

  const reconnectWalletInBackground = useCallback(async () => {
    try {
      await connectWallet();
    } catch (walletError) {
      reportError(walletError, {
        area: 'wallet',
        tags: { stage: 'restore-background' },
        extra: {
          ...baseReportExtras(),
          hasExistingWallet: wallets.length > 0,
        },
      });
    }
  }, [baseReportExtras, connectWallet, wallets.length]);

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
        await connectWallet();
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
      connectWallet,
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

    try {
      // Path 1: try to restore an existing app session via the refresh cookie.
      // This is the fast path for page reloads and returning sessions. Keep it
      // silent: a normal browser refresh should not look like a fresh login.
      const refreshedSession = await refreshBackendSession().catch(() => null);

      if (refreshedSession) {
        try {
          const me = await getBackendMe(refreshedSession.access_token);
          finalizeAuthenticatedSession(refreshedSession.access_token, me);
          void reconnectWalletInBackground();
          return;
        } catch {
          // Refresh token was valid but user is inaccessible (e.g. soft-deleted).
          // Clear the stale cookie and fall through to Openfort re-auth.
          await logoutBackendSession().catch(() => undefined);
        }
      }

      // Paths 2 & 3: no valid refresh cookie; re-authenticate via Openfort token.
      // Only this path represents an interactive login/bootstrap, so this is
      // where the visible 5-step progress modal starts.
      setStepPlan([
        'signing_in',
        'checking_account',
        'restoring_session',
        'loading_profile',
        'connecting_wallet',
      ]);
      completeStep('signing_in');
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
    finalizeAuthenticatedSession,
    getAccessToken,
    hideProgress,
    openfortUserId,
    reconnectWalletInBackground,
    setStepPlan,
    startStep,
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

  // Disconnect convergence point: both the avatar-menu Disconnect button and
  // the Openfort built-in modal Disconnect end up here (the latter via the
  // secondary "signedOut" useEffect below). We fully await the Openfort
  // logout so the SDK clears its storage before hard-navigating; otherwise
  // OpenfortProvider re-mounts from still-populated storage on reload and
  // auto-restores the auth state, which kicks off the bootstrap flow.
  //
  // We do NOT touch React state (clearSession / setStatus) before awaiting,
  // because state changes trigger re-renders and the bootstrap useEffect can
  // re-fire mid-await (isAuthenticated is still true until openfortLogout
  // synchronously resets the SDK store), seeding the 5-step modal which
  // would flash for ~100ms before hardNavigateToRoot reloads. The
  // logoutInProgressRef guard on the bootstrap useEffect already covers
  // that race, but keeping React state untouched here is the cleanest
  // belt-and-suspenders.
  const logout = useCallback(async () => {
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;

    closeOpenfortModal();

    await logoutBackendSession().catch(() => undefined);
    await openfortLogout().catch(() => undefined);

    hardNavigateToRoot();
  }, [closeOpenfortModal, openfortLogout]);

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

    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;
    clearSession();
    setStatus('unauthenticated');

    await logoutBackendSession().catch(() => undefined);
    await openfortLogout().catch(() => undefined);

    hardNavigateToRoot();
  }, [
    backendAccessToken,
    baseReportExtras,
    clearSession,
    commitUserFacingError,
    openfortLogout,
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
    closeOpenfortModal();
    // Mount-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Primary driver: react to Openfort auth state changes.
  // bootstrapAttemptKey deduplicate calls so we run bootstrap exactly once
  // per (user, retryCount) pair, even when the effect re-fires because a
  // callback was recreated due to dependency changes mid-flow.
  useEffect(() => {
    // Don't run any bootstrap work while a disconnect is in flight. logout()
    // calls clearSession() (which resets bootstrapAttemptKeyRef) and
    // setStatus('unauthenticated') BEFORE awaiting openfortLogout, so for the
    // brief window where openfortLogout's async storage clear is still pending,
    // isAuthenticated is still true and the deduplication key is null — without
    // this guard the bootstrap useEffect would re-fire and seed the 5-step
    // modal, which then flashes for ~100ms before the hard reload.
    if (logoutInProgressRef.current) return;

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

  // Secondary driver: catch the Openfort built-in modal Disconnect path so it
  // converges on the same exit state as the avatar-menu logout(). Openfort's
  // own sign-out does not call our backend logout endpoint and does not strip
  // OAuth callback params from the URL, so we own that cleanup here. We also
  // re-await openfortLogout() (idempotent) to make sure storage is fully
  // cleared before we hard-navigate; otherwise the SDK can re-hydrate from
  // storage on the next mount and bounce the user back through bootstrap.
  // The logoutInProgress ref prevents double-firing when the avatar-menu
  // logout() ran first (it already does its own cleanup + navigation).
  useEffect(() => {
    const signedOut =
      previousAuthState.current && !isLoading && !isAuthenticated;

    previousAuthState.current = isAuthenticated;

    if (!signedOut) return;
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;

    clearSession();
    setStatus('unauthenticated');
    void (async () => {
      await logoutBackendSession().catch(() => undefined);
      await openfortLogout().catch(() => undefined);
      hardNavigateToRoot();
    })();
  }, [clearSession, isAuthenticated, isLoading, openfortLogout]);

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
