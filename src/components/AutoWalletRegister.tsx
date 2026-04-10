'use client';

import {
  useAccount,
  useDisconnect,
  useModal,
  useParticleAuth,
  useWallets,
} from '@particle-network/connectkit';
import {
  hasExternalWalletSupport,
  isParticleConfigured,
  missingParticleEnvKeys,
} from '@/lib/particle-config';
import { Suspense, useEffect, useState } from 'react';
import { CustomButton } from './ui/custom-button';

export interface SurveyData {
  role: string;
  type: string;
  confirm_tos: boolean;
  first_name?: string;
  last_name?: string;
  phone_number: string;
  email: string;
  contact_fullname?: string;
  company_name?: string;
}

interface ParticleViewerProps {
  surveyData?: SurveyData | null;
}

interface UserInfo {
  uuid?: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

const CONTACT_STORAGE_KEY = 'particle_contact_email';

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readCandidate(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const nextValue = value.trim();
  return nextValue.length > 0 ? nextValue : null;
}

function getParticleEmail(userInfo: UserInfo | null) {
  if (!userInfo) {
    return null;
  }

  const candidates = [
    userInfo.email,
    userInfo['socialEmail'],
    userInfo['social_email'],
    userInfo['thirdpartyEmail'],
    userInfo['thirdparty_email'],
    userInfo['google_email'],
    userInfo['apple_email'],
    userInfo['github_email'],
  ];

  for (const candidate of candidates) {
    const nextValue = readCandidate(candidate);

    if (nextValue) {
      return nextValue;
    }
  }

  return null;
}

function ParticleSetupWarning() {
  return (
    <div className="space-y-4 text-left">
      <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4">
        <p className="text-sm font-semibold text-red-300">
          Particle is not configured yet.
        </p>
        <p className="mt-2 text-sm text-[#C7CAD5]">
          Add the missing public keys before opening the Particle modal.
        </p>
        <p className="mt-3 font-mono text-xs text-red-200">
          {missingParticleEnvKeys.join(', ')}
        </p>
      </div>
    </div>
  );
}

function ConfiguredParticleViewer({ surveyData }: ParticleViewerProps) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { setOpen } = useModal();
  const { getUserInfo } = useParticleAuth();
  const [primaryWallet] = useWallets();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(false);
  const [contactMode, setContactMode] = useState<'same' | 'other'>('same');
  const [contactEmail, setContactEmail] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);
  const [savedContactEmail, setSavedContactEmail] = useState<string | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isParticleAuth =
    primaryWallet?.connector?.walletConnectorType === 'particleAuth';
  const particleEmail = getParticleEmail(userInfo);
  const resolvedContactEmail =
    contactMode === 'same' && particleEmail
      ? particleEmail
      : contactEmail.trim();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedEmail = window.localStorage.getItem(CONTACT_STORAGE_KEY);

    if (!storedEmail) {
      return;
    }

    setSavedContactEmail(storedEmail);
    setContactEmail(storedEmail);
  }, []);

  useEffect(() => {
    if (particleEmail) {
      if (!savedContactEmail || savedContactEmail === particleEmail) {
        setContactMode('same');
      }

      return;
    }

    if (!contactEmail && surveyData?.email) {
      setContactEmail(surveyData.email);
    }
  }, [contactEmail, particleEmail, savedContactEmail, surveyData?.email]);

  useEffect(() => {
    if (!isConnected || !isParticleAuth) {
      setUserInfo(null);
      setLoadingUserInfo(false);
      return;
    }

    let isCancelled = false;

    const fetchUserInfo = async () => {
      setLoadingUserInfo(true);

      try {
        const info = await getUserInfo();

        if (!isCancelled) {
          setUserInfo((info ?? null) as unknown as UserInfo | null);
        }
      } catch {
        if (!isCancelled) {
          setContactError(
            'Connected, but Particle did not return user info yet.'
          );
        }
      } finally {
        if (!isCancelled) {
          setLoadingUserInfo(false);
        }
      }
    };

    void fetchUserInfo();

    return () => {
      isCancelled = true;
    };
  }, [getUserInfo, isConnected, isParticleAuth]);

  const handleDisconnect = () => {
    disconnect();
    setUserInfo(null);
    setContactError(null);
    setStatusMessage(null);
  };

  const handleSaveContact = () => {
    const nextEmail = resolvedContactEmail;

    if (!isValidEmail(nextEmail)) {
      setContactError('Enter a valid contact email before continuing.');
      setStatusMessage(null);
      return;
    }

    window.localStorage.setItem(CONTACT_STORAGE_KEY, nextEmail);
    setSavedContactEmail(nextEmail);
    setContactError(null);
    setStatusMessage(`Contact email saved: ${nextEmail}`);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-white">
          Continue with Particle
        </h1>
        <p className="text-sm text-[#C7CAD5]">
          One login flow for social sign-in and external wallets.
        </p>
      </div>

      {!hasExternalWalletSupport && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-200">
            External wallets need `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.
          </p>
          <p className="mt-2 text-sm text-[#C7CAD5]">
            Social login is ready now. Add the WalletConnect project ID to
            enable MetaMask, Coinbase Wallet, and similar wallets in the same
            Particle modal.
          </p>
        </div>
      )}

      {surveyData && (
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4">
          <p className="text-sm font-semibold text-cyan-300">
            Survey details found
          </p>
          <p className="mt-2 text-sm text-[#C7CAD5]">
            We can reuse{' '}
            <span className="font-medium text-white">{surveyData.email}</span>{' '}
            as your fallback contact email if your wallet login does not provide
            one.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-white/10 bg-[#10151D] p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8087A3]">
          Connection
        </p>
        {isConnected && address ? (
          <div className="mt-4 space-y-2">
            <p className="text-xl font-semibold text-white">
              {truncateAddress(address)}
            </p>
            <p className="text-sm text-[#C7CAD5]">
              {isParticleAuth
                ? 'Connected with Particle social login'
                : 'Connected with an external wallet'}
            </p>
            {userInfo?.name && (
              <p className="text-sm text-[#C7CAD5]">
                Signed in as <span className="text-white">{userInfo.name}</span>
              </p>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#C7CAD5]">
            Open the Particle modal to sign in with social login or connect an
            existing wallet.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <CustomButton className="flex-1" onClick={() => setOpen(true)}>
            {isConnected ? 'Open Particle' : 'Login with Particle'}
          </CustomButton>
          {isConnected && (
            <CustomButton
              variant="outlined"
              className="flex-1"
              onClick={handleDisconnect}
            >
              Disconnect
            </CustomButton>
          )}
        </div>
      </div>

      {loadingUserInfo && (
        <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-4">
          <p className="text-sm text-blue-200">Loading Particle profile...</p>
        </div>
      )}

      {isConnected && (
        <div className="rounded-lg border border-white/10 bg-[#10151D] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8087A3]">
            Contact details
          </p>

          {particleEmail ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-[#C7CAD5]">
                Particle returned{' '}
                <span className="font-medium text-white">{particleEmail}</span>.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setContactMode('same')}
                  className={`rounded-lg border px-4 py-3 text-left transition ${
                    contactMode === 'same'
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-white/10 bg-transparent text-[#C7CAD5]'
                  }`}
                >
                  <span className="block text-sm font-semibold">
                    Same as login
                  </span>
                  <span className="mt-1 block text-xs">{particleEmail}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContactMode('other')}
                  className={`rounded-lg border px-4 py-3 text-left transition ${
                    contactMode === 'other'
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-white/10 bg-transparent text-[#C7CAD5]'
                  }`}
                >
                  <span className="block text-sm font-semibold">
                    Use another email
                  </span>
                  <span className="mt-1 block text-xs">
                    Keep a separate contact address
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#C7CAD5]">
              This wallet session did not return an email. Add one so the team
              can contact you after login.
            </p>
          )}

          {(contactMode === 'other' || !particleEmail) && (
            <div className="mt-4 space-y-2">
              <label
                htmlFor="contact-email"
                className="block text-sm font-medium text-white"
              >
                Contact email
              </label>
              <input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(event) => {
                  setContactEmail(event.target.value);
                  setContactError(null);
                  setStatusMessage(null);
                }}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-white/10 bg-[#0C0C0D] px-4 py-3 text-white outline-none transition focus:border-primary"
              />
            </div>
          )}

          {savedContactEmail && (
            <p className="mt-4 text-sm text-[#C7CAD5]">
              Saved contact email:{' '}
              <span className="font-medium text-white">
                {savedContactEmail}
              </span>
            </p>
          )}

          {contactError && (
            <p className="mt-4 text-sm text-red-300">{contactError}</p>
          )}

          {statusMessage && (
            <p className="mt-4 text-sm text-green-300">{statusMessage}</p>
          )}

          <div className="mt-5">
            <CustomButton className="w-full" onClick={handleSaveContact}>
              Save contact preference
            </CustomButton>
          </div>
        </div>
      )}
    </div>
  );
}

function ParticleViewerContent({ surveyData }: ParticleViewerProps) {
  if (!isParticleConfigured) {
    return <ParticleSetupWarning />;
  }

  return <ConfiguredParticleViewer surveyData={surveyData} />;
}

export default function ParticleViewer({ surveyData }: ParticleViewerProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[320px] items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <ParticleViewerContent surveyData={surveyData} />
    </Suspense>
  );
}
