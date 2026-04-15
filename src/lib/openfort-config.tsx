'use client';

import { OpenfortProvider, AuthProvider } from '@openfort/react';
import { getDefaultConfig, OpenfortWagmiBridge } from '@openfort/react/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { baseSepolia, base } from 'viem/chains';
import { createConfig, WagmiProvider } from 'wagmi';
import type { ReactNode } from 'react';
import { AuthSessionProvider } from '@/components/auth/auth-session-provider';

const publishableKey = process.env.NEXT_PUBLIC_OPENFORT_PUBLIC_KEY;
const shieldPublishableKey = process.env.NEXT_PUBLIC_SHIELD_API_KEY;

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || undefined;

const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: 'InfraFund',
    chains: [baseSepolia, base],
    ssr: true,
    ...(walletConnectProjectId ? { walletConnectProjectId } : {}),
  })
);

const queryClient = new QueryClient();

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
                ethereumFeeSponsorshipId:
                  process.env.NEXT_PUBLIC_POLICY_ID || undefined,
              },
              connectOnLogin: true,
              createEncryptedSessionEndpoint: '/api/auth/encryption-session',
            }}
            uiConfig={{
              theme: 'midnight',
              mode: 'dark',
              authProviders: [AuthProvider.GOOGLE, AuthProvider.EMAIL_OTP],
            }}
          >
            <AuthSessionProvider>{children}</AuthSessionProvider>
          </OpenfortProvider>
        </OpenfortWagmiBridge>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
