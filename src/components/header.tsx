'use client';

import { Bell, Headset, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { AppPageHeader } from '@/components/layout/app-page-header';
import { getDigitalTwinProject } from '@/lib/digital-twin-projects';
import { useAuthSession } from '@/components/auth/auth-session-provider';
import { AvatarMenu } from './header/avatar-menu';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/home': 'Dashboard',
  '/explore-projects': 'Explore Projects',
  '/my-projects': 'My Projects',
  '/create-project': 'Create Project',
  '/tokenization': 'Tokenization',
  '/investment-portal': 'Investment Portal',
  '/digital-assets': 'Digital Assets',
  '/investor-management': 'Investor Management',
  '/investment-requests': 'Investment Requests',
  '/asset-management': 'Asset Management',
  '/claim-proposal': 'Claim Proposal',
  '/vote': 'Vote',
  '/ai-competition': 'AI Competition',
  '/proposal-approval': 'Proposal Approval',
  '/create-approval': 'Create Approval',
  '/plan-approval': 'Plan Approval',
  '/swap': 'Swap',
  '/kyc': 'KYC',
  '/account': 'Account Settings',
};

function formatRole(role: string | null | undefined) {
  if (!role) {
    return null;
  }

  if (role === 'project_owner') {
    return 'Client';
  }

  if (role === 'governance') {
    return 'DAO';
  }

  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

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
  const { backendUser } = useAuthSession();
  const role = formatRole(backendUser?.role);

  return (
    <AppPageHeader
      title={pageTitle}
      titleMeta={
        role ? (
          <span className="chakra-petch rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-sm font-medium tracking-[0.08em] text-primary">
            {role}
          </span>
        ) : null
      }
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
            <AvatarMenu />
          </span>
        </>
      }
    />
  );
}
