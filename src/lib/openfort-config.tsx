'use client';

import {
  AuthProvider,
  OpenfortProvider,
  RecoveryMethod,
} from '@openfort/react';
import { getDefaultConfig, OpenfortWagmiBridge } from '@openfort/react/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
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

// Called by the Openfort SDK when it needs to create or restore the Shield
// encryption session for this user's embedded wallet. Runs server-side (our
// Next.js API route) so SHIELD_SECRET_KEY is never exposed to the client.
// Openfort passes this token to the Shield service as proof that our backend
// has authorised the key-share operation.
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

// Workaround for an Openfort SDK bug (openfort-xyz/openfort-js#275):
// EmbeddedWalletApi.createIframe() appends the hidden iframe to document.body
// without setting a referrerpolicy attribute. Openfort's edge (Cloudflare)
// enforces an origin allowlist check via the Referer request header, so when
// the browser sends the iframe navigation without a Referer — which happens
// when no referrer policy is explicitly set — the response is 403 and the
// wallet never becomes READY.
//
// We cannot use a MutationObserver (fires after appendChild as a microtask)
// or a document-level Referrer-Policy header / <meta name="referrer"> tag
// because Chrome commits the iframe navigation's referrer policy synchronously
// at the appendChild call site — any attribute set after appendChild is too late.
//
// Instead we patch Node.prototype.appendChild so our code runs synchronously
// BEFORE the real appendChild, allowing us to set referrerpolicy="origin" while
// the element is still detached. The patch is scoped to the component lifetime
// and is narrowly targeted: it only acts on <iframe id="openfort-iframe">.
function OpenfortIframeFix() {
  useEffect(() => {
    const original = Node.prototype.appendChild;
    Node.prototype.appendChild = function <T extends Node>(child: T): T {
      if (
        child instanceof HTMLIFrameElement &&
        child.id === 'openfort-iframe' &&
        !child.referrerPolicy
      ) {
        child.referrerPolicy = 'origin';
      }
      return original.call(this, child) as T;
    };
    return () => {
      Node.prototype.appendChild = original;
    };
  }, []);
  return null;
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
              // connectOnLogin: false defers wallet creation until after our
              // backend has verified the user's eligibility (qualification
              // questionnaire). Without this flag the SDK would attempt to
              // create/connect the embedded wallet immediately on auth,
              // before we know whether the user is new or existing and
              // before the qualification gate has been passed.
              // AuthSessionProvider explicitly calls create() at the right
              // moment via createWalletIfNeeded().
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
            {/* OpenfortIframeFix must live inside OpenfortProvider so it mounts
                before AuthSessionProvider can trigger wallet creation. It patches
                appendChild for its own lifetime and is narrowly targeted. */}
            <OpenfortIframeFix />
            <AuthSessionProvider>{children}</AuthSessionProvider>
          </OpenfortProvider>
        </OpenfortWagmiBridge>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
