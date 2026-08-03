'use client';

// AuthSessionProvider bridges Privy identity with our app session.
//
// Design: Privy owns auth (Google/Email) and embedded wallets. We own the app
// session (JWT + httpOnly refresh cookie), user profile, and the qualification
// gate. embeddedWallets.createOnLogin: 'off' means Privy never auto-creates a
// wallet — we trigger it explicitly after the qualification gate.
//
// Status machine:
//   idle → loading → needs_onboarding → loading → creating_wallet → authenticated
//                 ↘ creating_wallet → authenticated   (existing user)
//                 ↘ error                             (any failure)
//
// New-user path (registration):
//   Privy auth → check backend (exists: false) → qualification questionnaire
//   → backend exchange with role/type → createWalletIfNeeded → authenticated
//
// Existing-user path (login):
//   Privy auth → refresh cookie valid? → getBackendMe → createWalletIfNeeded
//                                     ↘ no cookie → check backend (exists: true)
//                                       → backend exchange → createWalletIfNeeded

import { useCreateWallet, usePrivy, useWallets } from '@privy-io/react-auth';
import {
  checkPrivyUser,
  deleteBackendAccount,
  exchangePrivySession,
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

function hardNavigateToRoot() {
  if (typeof window === 'undefined') return;
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
  signing_in: 'Authenticating',
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
  privyUser: ReturnType<typeof usePrivy>['user'];
  isPrivyReady: boolean;
  isPrivyAuthenticated: boolean;
  error: string | null;
  errorCategory: ErrorCategory | null;
  retry: () => void;
  refreshSession: () => Promise<string | null>;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
  authProgress: AuthProgress | null;
  dismissProgress: () => void;
  cancelAuthFlow: () => Promise<void>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);
const ONBOARDING_STORAGE_KEY = 'infrafund:onboarding-draft';

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
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
  if (/failed to fetch|networkerror/i.test(message)) {
    return 'We hit a network issue. Please try again.';
  }
  if (/internal server error/i.test(message)) {
    return 'Our service is temporarily unavailable. Please try again in a moment.';
  }
  if (
    /user type is required|user role is required|organization name is required/i.test(
      message
    )
  ) {
    return `Account setup is missing required onboarding data. ${message}`;
  }
  if (/not logged in|session expired|invalid.*access token/i.test(message)) {
    return 'Your session expired. Please sign in again.';
  }
  if (message && message !== 'Failed to initialize your session.') {
    return message;
  }
  return 'Something went wrong. Please try again.';
}

function classifyError(message: string): ErrorCategory {
  if (
    /failed to fetch|networkerror|timeout|temporarily|try again/i.test(message)
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
  const {
    user,
    ready,
    authenticated,
    logout: privyLogout,
    getAccessToken,
  } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const privyUserId = user?.id ?? null;
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
    (id: AuthStepId) =>
      updateStep(id, { status: 'active', errorMessage: undefined }),
    [updateStep]
  );

  const completeStep = useCallback(
    (id: AuthStepId) =>
      updateStep(id, { status: 'done', errorMessage: undefined }),
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
    (id: AuthStepId, errorMessage: string) =>
      updateStep(id, { status: 'error', errorMessage }),
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

  const clearProgress = useCallback(() => setAuthProgress(null), []);

  const dismissProgress = useCallback(() => setAuthProgress(null), []);

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
    await privyLogout().catch(() => undefined);
    hardNavigateToRoot();
  }, [clearSession, privyLogout]);

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
      privyUserId: privyUserId ? privyUserId.slice(-6) : null,
    }),
    [privyUserId, pathname, retryCount]
  );

  const finalizeAuthenticatedSession = useCallback(
    (accessToken: string, currentUser: BackendMeResponse) => {
      setBackendAccessToken(accessToken);
      setBackendUser(currentUser);
      setPendingOnboardingAccessToken(null);
      setPendingWalletCreation(null);
      setError(null);
      setErrorCategory(null);
      clearOnboardingDraft();
      setStatus('authenticated');
    },
    []
  );

  // Creates the Privy embedded wallet for the user if they don't already have
  // one. With Biconomy, this EOA becomes the signer for the smart account.
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
      startStep(walletStepId);

      try {
        // createOnLogin is 'off' (see app-providers.tsx), so Privy never
        // auto-creates a wallet — we have to call createWallet() ourselves,
        // exactly once, at this point past the qualification gate. Returning
        // users already have one; createWallet() would throw for them since
        // createAdditional defaults to false, so only call it when missing.
        const hasEmbeddedWallet = wallets.some(
          (w) => w.walletClientType === 'privy'
        );

        if (!hasEmbeddedWallet) {
          await createWallet();
        }

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
      createWallet,
      failStep,
      finalizeAuthenticatedSession,
      startStep,
      wallets,
    ]
  );

  const bootstrapSession = useCallback(async () => {
    if (!privyUserId) {
      clearSession();
      setStatus('unauthenticated');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      // Path 1: restore via refresh cookie (fast path for page reloads).
      const refreshedSession = await refreshBackendSession().catch(() => null);

      if (refreshedSession) {
        try {
          const me = await getBackendMe(refreshedSession.access_token);
          finalizeAuthenticatedSession(refreshedSession.access_token, me);
          return;
        } catch {
          await logoutBackendSession().catch(() => undefined);
        }
      }

      // Paths 2 & 3: interactive login via Privy token.
      setStepPlan([
        'signing_in',
        'checking_account',
        'restoring_session',
        'loading_profile',
        'connecting_wallet',
      ]);
      completeStep('signing_in');
      startStep('checking_account');

      const privyAccessToken = await getAccessToken();

      if (!privyAccessToken) {
        throw new Error('Privy access token is unavailable.');
      }

      const checkResponse = await checkPrivyUser(privyAccessToken);
      completeStep('checking_account');

      if (!checkResponse.exists) {
        // Path 3: new user — show qualification questionnaire.
        setPendingOnboardingAccessToken(privyAccessToken);
        hideProgress();
        setStatus('needs_onboarding');
        return;
      }

      // Path 2: existing user — exchange token for app session.
      startStep('restoring_session');
      const loginResponse = await exchangePrivySession(privyAccessToken);
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
    commitUserFacingError,
    completeStep,
    createWalletIfNeeded,
    finalizeAuthenticatedSession,
    getAccessToken,
    hideProgress,
    privyUserId,
    setStepPlan,
    startStep,
  ]);

  const completeOnboarding = useCallback(
    async ({ role, type, organizationName }: QualificationSubmission) => {
      if (!pendingOnboardingAccessToken) {
        setError('Privy access token is unavailable.');
        setStatus('error');
        return;
      }

      setStatus('loading');
      setError(null);

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
        const loginResponse = await exchangePrivySession(
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
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;
    await logoutBackendSession().catch(() => undefined);
    await privyLogout().catch(() => undefined);
    hardNavigateToRoot();
  }, [privyLogout]);

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
    await privyLogout().catch(() => undefined);
    hardNavigateToRoot();
  }, [
    backendAccessToken,
    baseReportExtras,
    clearSession,
    commitUserFacingError,
    privyLogout,
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

  const refreshSession = useCallback(async () => {
    try {
      const refreshedSession = await refreshBackendSession();
      const me = await getBackendMe(refreshedSession.access_token);
      setBackendAccessToken(refreshedSession.access_token);
      setBackendUser(me);
      setError(null);
      setErrorCategory(null);
      return refreshedSession.access_token;
    } catch (refreshError) {
      reportError(refreshError, {
        area: 'auth',
        tags: { stage: 'manual-refresh' },
        extra: baseReportExtras(),
      });
      setBackendAccessToken(null);
      setBackendUser(null);
      return null;
    }
  }, [baseReportExtras]);

  // Primary driver: react to Privy auth state changes.
  useEffect(() => {
    if (logoutInProgressRef.current) return;
    if (!ready) {
      setStatus((current) =>
        current === 'authenticated' || current === 'needs_onboarding'
          ? current
          : 'loading'
      );
      return;
    }

    if (!authenticated || !privyUserId) {
      clearSession();
      setStatus('unauthenticated');
      return;
    }

    const bootstrapAttemptKey = `${privyUserId}:${retryCount}`;
    if (bootstrapAttemptKeyRef.current === bootstrapAttemptKey) return;
    bootstrapAttemptKeyRef.current = bootstrapAttemptKey;

    void bootstrapSession();
  }, [
    bootstrapSession,
    clearSession,
    authenticated,
    ready,
    privyUserId,
    retryCount,
  ]);

  // Secondary driver: catch Privy sign-out so we converge on the same exit state.
  useEffect(() => {
    const signedOut = previousAuthState.current && ready && !authenticated;
    previousAuthState.current = authenticated;

    if (!signedOut) return;
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;

    clearSession();
    setStatus('unauthenticated');
    void (async () => {
      await logoutBackendSession().catch(() => undefined);
      await privyLogout().catch(() => undefined);
      hardNavigateToRoot();
    })();
  }, [clearSession, authenticated, ready, privyLogout]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      status,
      backendAccessToken,
      backendUser,
      privyUser: user,
      isPrivyReady: ready,
      isPrivyAuthenticated: authenticated,
      error,
      errorCategory,
      retry,
      refreshSession,
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
      ready,
      authenticated,
      error,
      errorCategory,
      retry,
      refreshSession,
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
        privyUser={user}
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
