'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

function DashboardAuthLoading({ message }: { message?: string }) {
  return (
    <div className="relative z-[999] flex min-h-screen flex-1 items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-gray-400 chakra-petch">
          {message ?? 'Checking your session…'}
        </p>
      </div>
    </div>
  );
}

export function DashboardOpenfortGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const ok = Boolean(token);
    setHasToken(ok);
    setReady(true);
    if (!ok) {
      router.replace('/login');
    }
  }, [pathname, router]);

  if (!ready) {
    return <DashboardAuthLoading />;
  }

  if (!hasToken) {
    return null;
  }

  return <>{children}</>;
}
