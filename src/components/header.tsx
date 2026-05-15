'use client';

import { Bell, Headset, Menu } from 'lucide-react';
import { OpenfortButton } from '@openfort/react';
import { usePathname } from 'next/navigation';
import { AppPageHeader } from '@/components/layout/app-page-header';
import { getDigitalTwinProject } from '@/lib/digital-twin-projects';
import { AvatarMenu } from './header/avatar-menu';

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

function getPageTitle(pathname: string) {
  const digitalTwinMatch = pathname.match(
    /^\/projects\/([^/]+)\/digital-twin$/
  );

  if (digitalTwinMatch) {
    return getDigitalTwinProject(digitalTwinMatch[1])?.title ?? 'Digital Twin';
  }

  return routeTitles[pathname] || 'Page';
}

type HeaderProps = {
  onMenuClick?: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <AppPageHeader
      title={pageTitle}
      actions={
        <>
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={onMenuClick}
            className="rounded-full border border-white/15 p-2 text-white transition hover:border-primary/50 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
          >
            <Menu size={20} />
          </button>
          <span className="flex items-center gap-3">
            <Headset size={24} className="cursor-pointer text-white" />
            <Bell size={24} className="cursor-pointer text-white" />
            <OpenfortButton label="Wallet" showAvatar />
            <AvatarMenu />
          </span>
        </>
      }
    />
  );
}
