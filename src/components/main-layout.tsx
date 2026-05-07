'use client';
import type React from 'react';
import AppSidebar from './sidebar';
import Header from './header';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthLoadingState } from './auth/auth-state';
import { useAuthSession } from './auth/auth-session-provider';
import { AuthProgressModal } from './auth/auth-progress-modal';
import { BuildInfo } from './build-info';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicRoute = pathname === '/' || pathname === '/login';
  const { status, isOpenfortLoading } = useAuthSession();

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

  const isAwaitingOnboarding = status === 'needs_onboarding';
  // Pre-click SDK init only. Everything else (loading, creating_wallet, error)
  // is now owned by AuthProgressModal so the user sees one consistent surface.
  const showInitialSdkLoading = isOpenfortLoading;
  // Hide route content while bootstrap is in flight or has failed. The
  // progress modal sits on top, but the underlying page would otherwise
  // flash through (especially the dashboard on private routes, since
  // router.replace('/') is async).
  const isBootstrapping =
    status === 'idle' ||
    status === 'loading' ||
    status === 'creating_wallet' ||
    status === 'error';
  // Cover the brief window between page mount on `/?openfortAuthProviderUI=…`
  // and the AuthSessionProvider bootstrap useEffect running. Without this the
  // public landing flashes for a few hundred ms after Google redirects back.
  // Read the URL synchronously to avoid the flash on first render.
  const isHandlingOAuthCallback =
    typeof window !== 'undefined' &&
    window.location.search.includes('openfortAuthProviderUI');

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0C0C0D]">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 opacity-50 w-[662px] h-[662px] rounded-full blur-3xl bg-[#1A2A4AAD]" />
        <div className="absolute -bottom-44 -left-32 opacity-50 w-[662px] h-[662px] rounded-full blur-3xl bg-[#1A2A4AAD]" />
      </div>

      {isPublicRoute ? (
        <div className="relative z-[999] flex items-center justify-center min-h-screen p-4">
          {showInitialSdkLoading ? (
            <AuthLoadingState message="Loading…" />
          ) : isAwaitingOnboarding ||
            isBootstrapping ||
            isHandlingOAuthCallback ? null : (
            children
          )}
        </div>
      ) : (
        <div className="relative z-[999] flex min-h-screen items-center justify-center p-4 md:p-8 lg:p-12">
          {showInitialSdkLoading ||
          isBootstrapping ||
          isHandlingOAuthCallback ? (
            <AuthLoadingState message="Loading…" />
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
                  <BuildInfo className="pb-8 text-center" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <AuthProgressModal />
    </div>
  );
}
