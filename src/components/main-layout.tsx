'use client';
import type React from 'react';
import AppSidebar from './sidebar';
import Header from './header';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthErrorState, AuthLoadingState } from './auth/auth-state';
import { useAuthSession } from './auth/auth-session-provider';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicRoute = pathname === '/' || pathname === '/login';
  const { status, error, retry, isOpenfortLoading, isOpenfortAuthenticated } =
    useAuthSession();

  useEffect(() => {
    if (isOpenfortLoading || !pathname) {
      return;
    }

    if (isPublicRoute) {
      if (status === 'authenticated') {
        router.replace('/home');
      }

      return;
    }

    if (status !== 'authenticated') {
      router.replace('/');
    }
  }, [isOpenfortLoading, isPublicRoute, pathname, router, status]);

  const isCreatingWallet = status === 'creating_wallet';
  const showPublicAuthLoading =
    isOpenfortLoading ||
    (isOpenfortAuthenticated && (status === 'idle' || status === 'loading'));
  const showPrivateAuthLoading =
    isOpenfortLoading || status === 'idle' || status === 'loading';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0C0C0D]">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 opacity-50 w-[662px] h-[662px] rounded-full blur-3xl bg-[#1A2A4AAD]" />
        <div className="absolute -bottom-44 -left-32 opacity-50 w-[662px] h-[662px] rounded-full blur-3xl bg-[#1A2A4AAD]" />
      </div>

      {isPublicRoute ? (
        <div className="relative z-[999] flex items-center justify-center min-h-screen p-4">
          {isCreatingWallet ? (
            <AuthLoadingState message="Setting up your wallet..." />
          ) : showPublicAuthLoading ? (
            <AuthLoadingState message="Checking your Openfort session..." />
          ) : status === 'error' ? (
            <AuthErrorState
              message={error || 'Unable to continue.'}
              onRetry={retry}
            />
          ) : (
            children
          )}
        </div>
      ) : (
        <div className="relative z-[999] flex min-h-screen items-center justify-center p-4 md:p-8 lg:p-12">
          {isCreatingWallet ? (
            <AuthLoadingState message="Setting up your wallet..." />
          ) : showPrivateAuthLoading ? (
            <AuthLoadingState message="Restoring your InfraFund session..." />
          ) : status === 'error' ? (
            <AuthErrorState
              message={error || 'Unable to continue.'}
              onRetry={retry}
            />
          ) : (
            <div className="relative z-[999] flex p-4 md:p-8 lg:p-12 gap-4 md:gap-8 lg:gap-12 min-h-screen w-full">
              <div className="h-full -mt-3.5">
                <AppSidebar />
              </div>
              <div className="flex-1">
                <div className="flex flex-col h-fit px-12 gap-12">
                  <Header />
                  <main className="flex-1 backdrop-blur-sm rounded-lg">
                    {children}
                  </main>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
