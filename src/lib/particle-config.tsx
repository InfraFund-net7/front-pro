'use client';

import type React from 'react';
import { Suspense } from 'react';
import { ConnectKitProvider, createConfig } from '@particle-network/connectkit';
import { authWalletConnectors } from '@particle-network/connectkit/auth';
import { base, mainnet, polygon } from '@particle-network/connectkit/chains';
import { evmWalletConnectors } from '@particle-network/connectkit/evm';

const particleEnvironment = {
  NEXT_PUBLIC_PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID ?? '',
  NEXT_PUBLIC_CLIENT_KEY: process.env.NEXT_PUBLIC_CLIENT_KEY ?? '',
  NEXT_PUBLIC_APP_ID: process.env.NEXT_PUBLIC_APP_ID ?? '',
};

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '';

export const missingParticleEnvKeys = Object.entries(particleEnvironment)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const isParticleConfigured = missingParticleEnvKeys.length === 0;
export const hasExternalWalletSupport = Boolean(walletConnectProjectId);

const config = isParticleConfigured
  ? createConfig({
      projectId: particleEnvironment.NEXT_PUBLIC_PROJECT_ID,
      clientKey: particleEnvironment.NEXT_PUBLIC_CLIENT_KEY,
      appId: particleEnvironment.NEXT_PUBLIC_APP_ID,
      appearance: {
        mode: 'auto',
      },
      walletConnectors: [
        authWalletConnectors({
          authTypes: ['email', 'google', 'apple', 'twitter', 'github'],
        }),
        ...(hasExternalWalletSupport
          ? [
              evmWalletConnectors({
                metadata: {
                  name: 'InfraFund',
                  icon:
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/favicon.ico`
                      : '',
                  description: 'InfraFund account access',
                  url:
                    typeof window !== 'undefined' ? window.location.origin : '',
                },
                walletConnectProjectId,
              }),
            ]
          : []),
      ],
      chains: [mainnet, polygon, base],
    })
  : null;

export function ParticleConnectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!config) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<div>Loading Particle Connect...</div>}>
      <ConnectKitProvider config={config}>{children}</ConnectKitProvider>
    </Suspense>
  );
}
