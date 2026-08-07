'use client';

import { Check, Circle, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CustomButton } from '@/components/ui/custom-button';
import { BuildInfo } from '@/components/build-info';
import { useAuthSession, type AuthProgressStep } from './auth-session-provider';

const DEFAULT_STEP_TIMER_SECONDS = 5;
// Wallet steps round-trip through the Privy embedded-wallet iframe plus the
// Biconomy smart-account (CREATE2) address derivation, so they consistently
// take longer than the API-only steps.
const WALLET_STEP_TIMER_SECONDS = 10;
const SUCCESS_DISMISS_MS = 800;

function getStepTimerSeconds(stepId: string) {
  return stepId === 'connecting_wallet' || stepId === 'setting_up_wallet'
    ? WALLET_STEP_TIMER_SECONDS
    : DEFAULT_STEP_TIMER_SECONDS;
}

function StepIcon({ status }: { status: AuthProgressStep['status'] }) {
  switch (status) {
    case 'done':
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-black">
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
      );
    case 'active':
      return (
        <Loader2
          className="h-6 w-6 animate-spin text-primary"
          aria-label="In progress"
        />
      );
    case 'error':
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7F1D1D] text-white">
          <X className="h-4 w-4" strokeWidth={3} />
        </span>
      );
    case 'pending':
    default:
      return <Circle className="h-6 w-6 text-[#5A6275]" strokeWidth={1.5} />;
  }
}

function ActiveCountdown({ stepId }: { stepId: string }) {
  const initialSeconds = getStepTimerSeconds(stepId);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [stepId, initialSeconds]);

  if (secondsLeft > 0) {
    return <span className="text-xs text-[#8087A3]">~{secondsLeft}s</span>;
  }

  return <span className="text-xs text-[#8087A3]">Still working…</span>;
}

export function AuthProgressModal() {
  const { authProgress, retry, dismissProgress, cancelAuthFlow } =
    useAuthSession();
  const dismissTimerRef = useRef<number | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);

  const allDone =
    authProgress?.steps.length &&
    authProgress.steps.every((s) => s.status === 'done');
  const hasError = authProgress?.steps.some((s) => s.status === 'error');

  useEffect(() => {
    if (!authProgress?.isVisible) {
      setIsDismissing(false);
      if (dismissTimerRef.current !== null) {
        window.clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      return;
    }

    if (allDone && !hasError) {
      setIsDismissing(true);
      dismissTimerRef.current = window.setTimeout(() => {
        dismissProgress();
        dismissTimerRef.current = null;
      }, SUCCESS_DISMISS_MS);
    }

    return () => {
      if (dismissTimerRef.current !== null) {
        window.clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [allDone, hasError, authProgress?.isVisible, dismissProgress]);

  if (!authProgress || !authProgress.isVisible) return null;

  const headline = hasError
    ? 'Something went wrong'
    : isDismissing
      ? 'Signed in — taking you to your dashboard…'
      : 'Signing you in…';

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-[#090B11AA] backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-label="Authentication progress"
    >
      <div className="relative pointer-events-auto w-[28rem] max-w-[calc(100vw-2rem)] rounded-3xl border border-[#263247] bg-[#111827]/95 p-8 text-white shadow-2xl">
        <button
          type="button"
          onClick={() => void cancelAuthFlow()}
          aria-label="Close authentication flow"
          className="absolute right-4 top-4 text-[#808080] transition hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="mb-2 text-xl font-semibold">{headline}</h2>
        <p className="mb-6 text-sm text-[#8087A3]">
          {hasError
            ? 'One of the steps below failed. You can retry, or share the message with support.'
            : 'This usually takes 10–15 seconds. Hang tight while we get everything ready.'}
        </p>

        <ol className="flex flex-col gap-3">
          {authProgress.steps.map((step) => (
            <li
              key={step.id}
              className="flex flex-col gap-1 rounded-xl border border-[#1F2937] bg-[#0C0C0D]/60 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <StepIcon status={step.status} />
                <span
                  className={`flex-1 text-sm ${
                    step.status === 'pending'
                      ? 'text-[#5A6275]'
                      : step.status === 'error'
                        ? 'text-[#FCA5A5]'
                        : 'text-white'
                  }`}
                >
                  {step.label}
                </span>
                {step.status === 'active' && (
                  <ActiveCountdown stepId={step.id} />
                )}
              </div>
              {step.status === 'error' && step.errorMessage ? (
                <p className="ml-9 mt-1 text-xs text-[#FCA5A5]">
                  {step.errorMessage}
                </p>
              ) : null}
            </li>
          ))}
        </ol>

        {hasError ? (
          <div className="mt-6 flex flex-col items-stretch gap-3">
            <p className="text-xs text-[#8087A3]">
              If this keeps happening, copy the message above and send it to
              support so we can investigate.
            </p>
            <CustomButton
              variant="filled"
              className="w-full text-base"
              onClick={retry}
            >
              Retry
            </CustomButton>
            <CustomButton
              variant="outlined"
              className="w-full text-base"
              onClick={() => void cancelAuthFlow()}
            >
              Cancel and restart
            </CustomButton>
          </div>
        ) : null}

        <BuildInfo className="mt-6 w-full text-center" />
      </div>
    </div>
  );
}
