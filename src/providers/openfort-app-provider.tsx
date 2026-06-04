'use client';

import {
  AuthProvider,
  OpenfortProvider,
  type OpenfortWalletConfig,
} from '@openfort/react';
import { landingLegalUrls } from '@/lib/landing-legal-urls';
import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';

const publishableKey =
  process.env.NEXT_PUBLIC_OPENFORT_PUBLISHABLE_KEY?.trim() ?? '';

function buildWalletConfig(): OpenfortWalletConfig | undefined {
  const shieldPublishableKey =
    process.env.NEXT_PUBLIC_OPENFORT_SHIELD_PUBLISHABLE_KEY?.trim() ?? '';
  if (!shieldPublishableKey) {
    return undefined;
  }

  const chainRaw = process.env.NEXT_PUBLIC_OPENFORT_EMBEDDED_CHAIN_ID?.trim();
  const parsed = chainRaw ? Number.parseInt(chainRaw, 10) : 84532;
  const chainId = Number.isFinite(parsed) ? parsed : 84532;

  return {
    shieldPublishableKey,
    createEncryptedSessionEndpoint: '/api/openfort/encryption-session',
    connectOnLogin: true,
    ethereum: { chainId },
  };
}

/**
 * OpenfortProvider lazy-loads ConnectModal. Preload that chunk on the client so
 * dev/HMR and cache clears are less likely to hit ChunkLoadError on first open.
 */
function usePreloadOpenfortConnectModal() {
  useEffect(() => {
    void import(
      /* webpackChunkName: "openfort-connect-modal" */
      'openfort-internal-connect-modal'
    ).catch(() => {
      /* non-fatal; OpenfortProvider will retry via its own lazy() */
    });
  }, []);
}

export function OpenfortAppProvider({ children }: { children: ReactNode }) {
  usePreloadOpenfortConnectModal();
  const legal = useMemo(() => landingLegalUrls(), []);
  const walletConfig = useMemo(() => buildWalletConfig(), []);

  if (!publishableKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0C0C0D] p-8 text-center text-red-400">
        <p>
          Set{' '}
          <code className="text-white">
            NEXT_PUBLIC_OPENFORT_PUBLISHABLE_KEY
          </code>{' '}
          in <code className="text-white">.env.local</code> (same publishable
          key as the InfraFund backend OpenFort config).
        </p>
      </div>
    );
  }

  return (
    <OpenfortProvider
      publishableKey={publishableKey}
      walletConfig={walletConfig}
      uiConfig={{
        authProviders: [AuthProvider.EMAIL_OTP],
        termsOfServiceUrl: legal.terms,
        privacyPolicyUrl: legal.privacy,
      }}
    >
      {children}
    </OpenfortProvider>
  );
}
