'use client';

import { useAccount } from '@particle-network/connectkit';
import { useParticleAccountVerified } from '@/hooks/use-particle-account-verified';
import { useParticleSessionGate } from '@/hooks/use-particle-session-gate';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

function DashboardAuthLoading({
  message = 'Checking your Particle session…',
}: {
  message?: string;
}) {
  return (
    <div className="relative z-[999] flex min-h-screen flex-1 items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-gray-400 chakra-petch">{message}</p>
      </div>
    </div>
  );
}

export function ParticleDashboardGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const account = useAccount();
  const { verifyState, isFullyVerified } = useParticleAccountVerified();
  const { waitingForReconnectOrHydration } = useParticleSessionGate();

  const status = account.status;
  const connectorType =
    account.status === 'connected'
      ? account.connector.walletConnectorType
      : undefined;
  const address = account.status === 'connected' ? account.address : undefined;

  useEffect(() => {
    if (pathname?.startsWith('/sign-out')) {
      if (status === 'connecting' || status === 'reconnecting') {
        const id = window.setTimeout(() => {
          window.location.assign('/login');
        }, 7_000);
        return () => window.clearTimeout(id);
      }
    }
  }, [pathname, status]);

  useEffect(() => {
    if (status === 'connecting' || status === 'reconnecting') {
      return;
    }

    if (status === 'disconnected') {
      if (waitingForReconnectOrHydration) {
        return;
      }
      router.replace('/login');
      return;
    }

    if (status !== 'connected') {
      return;
    }

    if (connectorType !== 'particleAuth' || !address) {
      router.replace('/login');
      return;
    }

    if (verifyState === 'fail') {
      router.replace('/login');
    }
  }, [
    address,
    connectorType,
    router,
    status,
    verifyState,
    waitingForReconnectOrHydration,
  ]);

  if (status === 'connecting' || status === 'reconnecting') {
    return (
      <DashboardAuthLoading
        message={
          pathname?.startsWith('/sign-out') ? 'Signing you out…' : undefined
        }
      />
    );
  }

  if (status === 'disconnected') {
    return (
      <DashboardAuthLoading
        message={
          waitingForReconnectOrHydration ? 'Restoring your session…' : undefined
        }
      />
    );
  }

  if (status !== 'connected') {
    return <DashboardAuthLoading />;
  }

  if (connectorType !== 'particleAuth' || !address) {
    return <DashboardAuthLoading />;
  }

  if (!isFullyVerified) {
    return <DashboardAuthLoading />;
  }

  return <>{children}</>;
}
