'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { base, baseSepolia } from 'viem/chains';
import { AuthSessionProvider } from '@/components/auth/auth-session-provider';

const queryClient = new QueryClient();
const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

const defaultChain =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' ? base : baseSepolia;

function PrivyNotConfigured() {
  return (
    <div className="rounded-lg border border-yellow-500 bg-yellow-900/20 p-4 text-left text-sm text-yellow-100 max-w-md mx-auto mt-10">
      <p className="font-semibold">Privy is not configured.</p>
      <p className="mt-2">
        Add <code>NEXT_PUBLIC_PRIVY_APP_ID</code> to your{' '}
        <code>.env.local</code> file.
      </p>
    </div>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  if (!appId) {
    return (
      <QueryClientProvider client={queryClient}>
        <PrivyNotConfigured />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={appId}
        config={{
          loginMethods: ['email', 'google'],
          appearance: {
            theme: 'dark',
          },
          defaultChain,
          supportedChains: [base, baseSepolia],
          // createOnLogin: 'off' defers embedded wallet creation until after our
          // backend has verified the user's eligibility (qualification
          // questionnaire). AuthSessionProvider explicitly calls createWallet()
          // at the right moment via createWalletIfNeeded().
          embeddedWallets: {
            ethereum: {
              createOnLogin: 'off',
            },
          },
        }}
      >
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}
