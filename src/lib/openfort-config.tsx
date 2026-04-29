'use client';

import {
  AuthProvider,
  OpenfortProvider,
  RecoveryMethod,
} from '@openfort/react';
import { getDefaultConfig, OpenfortWagmiBridge } from '@openfort/react/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { base, baseSepolia } from 'viem/chains';
import { createConfig, WagmiProvider } from 'wagmi';
import { AuthSessionProvider } from '@/components/auth/auth-session-provider';

const publishableKey = process.env.NEXT_PUBLIC_OPENFORT_PUBLIC_KEY;
const shieldPublishableKey = process.env.NEXT_PUBLIC_SHIELD_API_KEY;
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || undefined;
const supportedChains = [base, baseSepolia] as const;
const defaultChainId =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'
    ? base.id
    : baseSepolia.id;

const queryClient = new QueryClient();
const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: 'InfraFund',
    chains: supportedChains,
    ssr: true,
    walletConnectProjectId,
  })
);

async function getEncryptionSession({
  accessToken,
  otpCode,
  userId,
}: {
  accessToken: string;
  otpCode?: string;
  userId: string;
}) {
  const response = await fetch('/api/auth/encryption-session', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ otp_code: otpCode, user_id: userId }),
  });
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data
        ? String(data.message)
        : 'Failed to create encryption session.';
    throw new Error(message);
  }

  if (
    !data ||
    typeof data !== 'object' ||
    !('session' in data) ||
    typeof data.session !== 'string'
  ) {
    throw new Error('Invalid encryption session response.');
  }

  return data.session;
}

function OpenfortNotConfigured() {
  return (
    <div className="rounded-lg border border-yellow-500 bg-yellow-900/20 p-4 text-left text-sm text-yellow-100 max-w-md mx-auto mt-10">
      <p className="font-semibold">Openfort is not configured.</p>
      <p className="mt-2">
        Add <code>NEXT_PUBLIC_OPENFORT_PUBLIC_KEY</code> and{' '}
        <code>NEXT_PUBLIC_SHIELD_API_KEY</code> to your <code>.env.local</code>{' '}
        file.
      </p>
    </div>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  if (!publishableKey || !shieldPublishableKey) {
    return (
      <QueryClientProvider client={queryClient}>
        <OpenfortNotConfigured />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <OpenfortWagmiBridge>
          <OpenfortProvider
            publishableKey={publishableKey}
            walletConfig={{
              shieldPublishableKey,
              ethereum: {
                chainId: defaultChainId,
                ethereumFeeSponsorshipId:
                  process.env.NEXT_PUBLIC_POLICY_ID || undefined,
              },
              connectOnLogin: false,
              getEncryptionSession,
            }}
            uiConfig={{
              theme: 'midnight',
              mode: 'dark',
              authProviders: [AuthProvider.GOOGLE, AuthProvider.EMAIL_OTP],
              walletRecovery: { defaultMethod: RecoveryMethod.AUTOMATIC },
            }}
          >
            <AuthSessionProvider>{children}</AuthSessionProvider>
          </OpenfortProvider>
        </OpenfortWagmiBridge>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
