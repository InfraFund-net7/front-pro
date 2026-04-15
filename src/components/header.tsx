'use client';

import { Bell, Headset } from 'lucide-react';
import { OpenfortButton } from '@openfort/react';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useAuthSession } from './auth/auth-session-provider';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/home': 'Dashboard',
  '/explore-projects': 'Explore Projects',
  '/create-project': 'Create Project',
  '/tokenization': 'Tokenization',
  '/investment-portal': 'Investment Portal',
  '/digital-assets': 'Digital Assets',
  '/investor-management': 'Investor Management',
  '/investment-requests': 'Investment Requests',
  '/asset-management': 'Asset Management',
  '/swap': 'Swap',
  '/kyc': 'KYC',
  '/account': 'Account',
};

export default function Header() {
  const pathname = usePathname();
  const { backendUser, openfortUser } = useAuthSession();
  const pageTitle = routeTitles[pathname] || 'Page';
  const displayName = useMemo(() => {
    const fullName = [backendUser?.first_name, backendUser?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || openfortUser?.name || openfortUser?.email || 'User';
  }, [
    backendUser?.first_name,
    backendUser?.last_name,
    openfortUser?.email,
    openfortUser?.name,
  ]);

  const secondaryLabel =
    openfortUser?.email || backendUser?.role || openfortUser?.id || 'Openfort';
  const avatarLabel = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex h-16 shrink-0 justify-between items-center sticky top-0 z-20 rounded-lg mb-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-normal text-white leading-2">
          Hi {displayName}
          <span className="text-[#8087A3] text-base font-normal">
            {' '}
            - {secondaryLabel}
          </span>
        </span>
        <span className="text-[40px] font-bold text-white">{pageTitle}</span>
      </div>

      <div className="flex justify-center items-center gap-4">
        <Headset size={24} className="text-white cursor-pointer" />
        <Bell size={24} className="text-white cursor-pointer" />
        <OpenfortButton label="Wallet" showAvatar />
        <div className="w-12 h-12 rounded-full bg-[#263247] flex justify-center items-center text-white">
          {avatarLabel}
        </div>
      </div>
    </div>
  );
}
