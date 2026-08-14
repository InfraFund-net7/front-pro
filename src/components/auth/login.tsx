'use client';

import {
  usePrivy,
  useLoginWithEmail,
  useLoginWithOAuth,
} from '@privy-io/react-auth';
import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { QrCode } from 'lucide-react';
import infrafund from '@/../public/assets/svg/infrafund.svg';
import googleIcon from '@/../public/assets/svg/google.svg';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';
import { BuildInfo } from '@/components/build-info';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PendingAction = 'email' | 'google' | 'verify' | null;

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Please try again.';
}

export default function Login() {
  const { ready, login } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { initOAuth } = useLoginWithOAuth();

  const [view, setView] = useState<'form' | 'verify'>('form');
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const isBusy = pendingAction !== null;

  const requireAgreement = () => {
    if (!agreed) {
      setError(
        "Please agree to infrafund's Terms of Service and Privacy Notice to continue."
      );
      return false;
    }
    return true;
  };

  const handleContinue = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready || isBusy || !requireAgreement()) return;

    if (!EMAIL_REGEX.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setError(null);
    setPendingAction('email');
    try {
      await sendCode({ email });
      setView('verify');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPendingAction(null);
    }
  };

  const handleGoogle = async () => {
    if (!ready || isBusy || !requireAgreement()) return;

    setError(null);
    setPendingAction('google');
    try {
      await initOAuth({ provider: 'google' });
    } catch (err) {
      setError(getErrorMessage(err));
      setPendingAction(null);
    }
  };

  const handleWallet = () => {
    if (!ready || isBusy || !requireAgreement()) return;

    setError(null);
    login({ loginMethods: ['wallet'] });
  };

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    if (isBusy || !code) return;

    setError(null);
    setPendingAction('verify');
    try {
      await loginWithCode({ code });
    } catch (err) {
      setError(getErrorMessage(err));
      setPendingAction(null);
    }
  };

  const handleResend = async () => {
    if (isBusy) return;

    setError(null);
    setPendingAction('email');
    try {
      await sendCode({ email });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPendingAction(null);
    }
  };

  const handleUseDifferentEmail = () => {
    setView('form');
    setCode('');
    setError(null);
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex w-full max-w-md flex-col items-center gap-8 rounded-[32px] border border-[#263247] bg-[#111827]/70 p-10">
        <Image src={infrafund} alt="InfraFund" />

        {view === 'form' ? (
          <form
            onSubmit={handleContinue}
            className="flex w-full flex-col items-center gap-8"
          >
            <h1 className="text-3xl font-bold text-white">
              Welcome to InfraFund
            </h1>

            <div className="flex w-full flex-col gap-4">
              <div className="flex w-full flex-col gap-2">
                <label
                  htmlFor="login-email"
                  className="text-sm font-medium text-white"
                >
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                  className="w-full rounded-xl border border-[#263247] bg-[#111827] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-start gap-3">
                <CustomCheckbox
                  checked={agreed}
                  onToggle={() => {
                    setAgreed((value) => !value);
                    setError(null);
                  }}
                  className="mt-0.5 h-6 w-6 shrink-0"
                />
                <p className="text-sm text-gray-300">
                  By creating an account, I agree to infrafund&apos;s{' '}
                  <span className="text-primary">Terms of Service</span> and{' '}
                  <span className="text-primary">Privacy Notice</span>.
                </p>
              </div>

              {error ? <p className="text-sm text-error">{error}</p> : null}

              <button
                type="submit"
                disabled={!ready || isBusy}
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-primary-disabled"
              >
                {pendingAction === 'email' ? 'Sending code…' : 'Continue'}
              </button>

              <div className="flex w-full items-center gap-4">
                <div className="h-px flex-1 bg-[#263247]" />
                <span className="text-sm text-gray-400">Or</span>
                <div className="h-px flex-1 bg-[#263247]" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={!ready || isBusy}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#263247] px-6 py-3 text-sm font-semibold text-white transition hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Image src={googleIcon} alt="" width={20} height={20} />
                {pendingAction === 'google'
                  ? 'Redirecting…'
                  : 'Continue with Google'}
              </button>

              <button
                type="button"
                onClick={handleWallet}
                disabled={!ready || isBusy}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#263247] px-6 py-3 text-sm font-semibold text-white transition hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <QrCode className="h-5 w-5" />
                Connect with Wallet
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handleVerify}
            className="flex w-full flex-col items-center gap-8"
          >
            <div className="space-y-3 text-center text-white">
              <h1 className="text-3xl font-bold">Check your email</h1>
              <p className="text-sm text-[#C7CAD5]">
                Enter the code we sent to <strong>{email}</strong>
              </p>
            </div>

            <div className="flex w-full flex-col gap-4">
              <div className="flex w-full flex-col gap-2">
                <label
                  htmlFor="login-code"
                  className="text-sm font-medium text-white"
                >
                  Verification code
                </label>
                <input
                  id="login-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter code"
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value);
                    setError(null);
                  }}
                  className="w-full rounded-xl border border-[#263247] bg-[#111827] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-primary"
                />
              </div>

              {error ? <p className="text-sm text-error">{error}</p> : null}

              <button
                type="submit"
                disabled={isBusy || !code}
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-primary-disabled"
              >
                {pendingAction === 'verify' ? 'Verifying…' : 'Verify'}
              </button>

              <div className="flex w-full items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isBusy}
                  className="text-primary transition hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pendingAction === 'email' ? 'Sending…' : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={handleUseDifferentEmail}
                  disabled={isBusy}
                  className="text-gray-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Use a different email
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <BuildInfo className="w-full text-center" />
    </div>
  );
}
