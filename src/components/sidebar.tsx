'use client';

import type React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowUpDown,
  BadgeCheck,
  Bot,
  Building,
  CheckSquare,
  Compass,
  FileCheck,
  Folder,
  Grid3X3,
  Home,
  Landmark,
  Layers,
  Rocket,
  Settings,
  ThumbsUp,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';

import infrafund from '@/../public/assets/svg/infrafund.svg';
import { useAuthSession } from '@/components/auth/auth-session-provider';
import type { AccountRole, AccountType } from '@/lib/backend-auth-client';

interface NavigationItem {
  id: string;
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: AccountRole[];
  types?: AccountType[];
}

interface AppSidebarProps {
  className?: string;
}

const PROJECT_OWNER_ITEMS: AccountRole[] = ['project_owner'];
const INVESTOR_ITEMS: AccountRole[] = ['investor'];
const CONTRACTOR_ITEMS: AccountRole[] = ['contractor'];
const DAO_ITEMS: AccountRole[] = ['governance'];
const AUDITOR_ITEMS: AccountRole[] = ['auditor'];

const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'home', title: 'Home Dashboard', url: '/home', icon: Home },
  {
    id: 'explore-projects',
    title: 'Explore Projects',
    url: '/explore-projects',
    icon: Compass,
    roles: [...PROJECT_OWNER_ITEMS, ...INVESTOR_ITEMS, ...CONTRACTOR_ITEMS],
  },
  {
    id: 'my-projects',
    title: 'My Projects',
    url: '/my-projects',
    icon: Folder,
    roles: [...PROJECT_OWNER_ITEMS, ...INVESTOR_ITEMS],
  },
  {
    id: 'create-project',
    title: 'Create Project',
    url: '/create-project',
    icon: Rocket,
    roles: PROJECT_OWNER_ITEMS,
  },
  {
    id: 'tokenization',
    title: 'Tokenization',
    url: '/tokenization',
    icon: Layers,
    roles: PROJECT_OWNER_ITEMS,
  },
  {
    id: 'swap',
    title: 'Swap',
    url: '/swap',
    icon: ArrowUpDown,
    roles: [...PROJECT_OWNER_ITEMS, ...INVESTOR_ITEMS, ...CONTRACTOR_ITEMS],
  },
  {
    id: 'investment-portal',
    title: 'Investment Portal',
    url: '/investment-portal',
    icon: Landmark,
    roles: PROJECT_OWNER_ITEMS,
  },
  {
    id: 'digital-assets',
    title: 'My Digital Asset Offering',
    url: '/digital-assets',
    icon: Grid3X3,
    roles: PROJECT_OWNER_ITEMS,
  },
  {
    id: 'investor-management',
    title: "Investor's Management",
    url: '/investor-management',
    icon: Users,
    roles: PROJECT_OWNER_ITEMS,
  },
  {
    id: 'investment-requests',
    title: 'Investment Requests',
    url: '/investment-requests',
    icon: TrendingUp,
    roles: PROJECT_OWNER_ITEMS,
  },
  {
    id: 'asset-management',
    title: 'Asset Management',
    url: '/asset-management',
    icon: Building,
    roles: [...PROJECT_OWNER_ITEMS, ...CONTRACTOR_ITEMS],
  },
  {
    id: 'claim-proposal',
    title: 'Claim Proposal',
    url: '/claim-proposal',
    icon: BadgeCheck,
    roles: CONTRACTOR_ITEMS,
  },
  {
    id: 'vote',
    title: 'Vote',
    url: '/vote',
    icon: ThumbsUp,
    roles: [...PROJECT_OWNER_ITEMS, ...CONTRACTOR_ITEMS],
  },
  {
    id: 'ai-competition',
    title: 'AI Competition',
    url: '/ai-competition',
    icon: Bot,
    roles: [...DAO_ITEMS, ...AUDITOR_ITEMS],
  },
  {
    id: 'proposal-approval',
    title: 'Proposal Approval',
    url: '/proposal-approval',
    icon: FileCheck,
    roles: [...DAO_ITEMS, ...AUDITOR_ITEMS],
  },
  {
    id: 'create-approval',
    title: 'Create Approval',
    url: '/create-approval',
    icon: CheckSquare,
    roles: [...DAO_ITEMS, ...AUDITOR_ITEMS],
  },
  {
    id: 'plan-approval',
    title: 'Plan Approval',
    url: '/plan-approval',
    icon: UserCheck,
    roles: [...DAO_ITEMS, ...AUDITOR_ITEMS],
  },
  {
    id: 'account-settings',
    title: 'Account Settings',
    url: '/account',
    icon: Settings,
  },
];

function canShowItem(
  item: NavigationItem,
  user?: { role?: string; type?: string } | null
) {
  if (!item.roles?.length && !item.types?.length) {
    return true;
  }

  if (!user) {
    return false;
  }

  const roleAllowed =
    !item.roles?.length || item.roles.includes(user.role as AccountRole);
  const typeAllowed =
    !item.types?.length || item.types.includes(user.type as AccountType);

  return roleAllowed && typeAllowed;
}

function getNavigationItems(user?: { role?: string; type?: string } | null) {
  return NAVIGATION_ITEMS.filter((item) => canShowItem(item, user));
}

function Navigation({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {items.map((item) => {
        const IconComponent = item.icon;
        const isActive = pathname === item.url;

        return (
          <div key={item.id} className="relative chakra-petch">
            <Link
              href={item.url}
              className={`
                w-full h-12 px-4 rounded-lg transition-all duration-200 ease-in-out
                flex items-center gap-3 group relative
                ${
                  isActive
                    ? 'bg-card-selected-bg text-primary'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
                }
              `}
            >
              <IconComponent className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium truncate">{item.title}</span>
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

export default function AppSidebar({ className = '' }: AppSidebarProps) {
  const { backendUser } = useAuthSession();
  const navigationItems = getNavigationItems(backendUser);

  return (
    <div
      className={`h-[928px] bg-card-bg border-card-bg-border text-white w-[261px] flex flex-col rounded-[40px] py-8 ${className}`}
    >
      <div className="w-full h-fit flex justify-start items-center px-7">
        <Image
          src={infrafund}
          width={172}
          height={42}
          alt="InfraFund Logo"
          priority
        />
      </div>

      <div className="px-4 py-6 flex-1 overflow-y-auto">
        <Navigation items={navigationItems} />
      </div>
    </div>
  );
}
