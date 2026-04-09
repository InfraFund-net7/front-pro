'use client';

import { useAccount, useParticleAuth } from '@particle-network/connectkit';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

function DashboardAuthLoading() {
  return (
    <div className="relative z-[999] flex min-h-screen flex-1 items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-gray-400 chakra-petch">
          Checking your Particle session…
        </p>
      </div>
    </div>
  );
}

export function ParticleDashboardGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const account = useAccount();
  const { getUserInfo } = useParticleAuth();
  const getUserInfoRef = useRef(getUserInfo);
  getUserInfoRef.current = getUserInfo;

  const [particleUserOk, setParticleUserOk] = useState<boolean | null>(null);

  const status = account.status;
  const connectorType =
    account.status === 'connected'
      ? account.connector.walletConnectorType
      : undefined;
  const address = account.status === 'connected' ? account.address : undefined;

  useEffect(() => {
    if (status !== 'connected') {
      setParticleUserOk(null);
      return;
    }

    if (connectorType !== 'particleAuth' || !address) {
      setParticleUserOk(null);
      return;
    }

    let cancelled = false;
    setParticleUserOk(null);

    void (async () => {
      try {
        const info = await getUserInfoRef.current();
        const ok =
          info != null && typeof info.uuid === 'string' && info.uuid.length > 0;
        if (!cancelled) {
          setParticleUserOk(ok);
        }
      } catch {
        if (!cancelled) {
          setParticleUserOk(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, connectorType, status]);

  useEffect(() => {
    if (status === 'connecting' || status === 'reconnecting') {
      return;
    }

    if (status === 'disconnected') {
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

    if (particleUserOk === false) {
      router.replace('/login');
    }
  }, [address, connectorType, particleUserOk, router, status]);

  if (status === 'connecting' || status === 'reconnecting') {
    return <DashboardAuthLoading />;
  }

  if (status === 'disconnected') {
    return <DashboardAuthLoading />;
  }

  if (status !== 'connected') {
    return <DashboardAuthLoading />;
  }

  if (connectorType !== 'particleAuth' || !address) {
    return <DashboardAuthLoading />;
  }

  if (particleUserOk !== true) {
    return <DashboardAuthLoading />;
  }

  return <>{children}</>;
}
