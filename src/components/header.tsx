'use client';

import { Bell, Headset } from 'lucide-react';
import { OpenfortButton } from '@openfort/react';
import { usePathname } from 'next/navigation';
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

export default function Header() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <div className="flex h-16 shrink-0 justify-between items-center sticky top-0 z-20 rounded-lg mb-4">
      <div className="flex flex-col gap-2">
        <span className="text-[40px] font-bold text-white">{pageTitle}</span>
      </div>

      <div className="flex justify-center items-center gap-4">
        <Headset size={24} className="text-white cursor-pointer" />
        <Bell size={24} className="text-white cursor-pointer" />
        <OpenfortButton label="Wallet" showAvatar />
        <AvatarMenu />
      </div>
    </div>
  );
}
