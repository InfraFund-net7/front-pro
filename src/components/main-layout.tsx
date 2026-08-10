'use client';
import type React from 'react';
import AppSidebar from './sidebar';
import Header from './header';
import { usePathname, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const { status, isPrivyReady, isPrivyAuthenticated } = useAuthSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isPrivyReady || !pathname) {
      return;
    }

    if (isPublicRoute) {
      if (status === 'authenticated') {
        router.replace('/home');
      }

      return;
    }

    if (status === 'unauthenticated') {
      router.replace('/');
    }
  }, [isPrivyReady, isPublicRoute, pathname, router, status]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const isAwaitingOnboarding = status === 'needs_onboarding';
  // Pre-click SDK init only. Everything else (loading, creating_wallet, error)
  // is now owned by AuthProgressModal so the user sees one consistent surface.
  // Show initial loading until Privy SDK has initialised (ready === true).
  const showInitialSdkLoading = !isPrivyReady;
  const isBootstrapping =
    status === 'idle' ||
    status === 'loading' ||
    status === 'creating_wallet' ||
    status === 'error';
  // Privy uses a modal for OAuth callbacks — no URL param detection needed.
  const isHandlingOAuthCallback = false;

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
            <div className="relative z-[999] flex min-h-screen w-full gap-4 p-4 md:gap-8 md:p-8 lg:gap-12 lg:p-12">
              <div className="hidden h-full -mt-3.5 lg:block">
                <AppSidebar />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex h-fit flex-col gap-6 px-4 md:px-8 xl:px-12">
                  <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
                  <main className="flex-1 rounded-lg backdrop-blur-sm">
                    {children}
                  </main>
                  <BuildInfo className="pb-8 text-center" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-[1000] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full max-w-[82vw]">
            <AppSidebar className="h-full rounded-none rounded-r-[32px]" />
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute right-4 top-4 rounded-full border border-white/15 bg-[#0C0C0D]/80 p-2 text-white transition hover:border-primary/50 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      ) : null}

      <AuthProgressModal />
    </div>
  );
}
