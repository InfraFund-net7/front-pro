'use client';

import type React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowUpDown,
  Building,
  Compass,
  FileText,
  Folder,
  Grid3X3,
  Home,
  IdCard,
  Landmark,
  Layers,
  Lock,
  Magnet,
  Rocket,
  TrendingUp,
  UserCircle,
  Users,
} from 'lucide-react';

import infrafund from '@/../public/assets/svg/infrafund.svg';

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  isDisabled?: boolean;
}

interface AppSidebarProps {
  className?: string;
  navigationItems?: NavigationItem[];
  model?: 'client' | 'full';
}

function getNavigationItems(model: 'client' | 'full' = 'client') {
  const fullItems: NavigationItem[] = [
    { title: 'Home', url: '/home', icon: Home },
    { title: 'Create Project', url: '/create-project', icon: Rocket },
    { title: 'Tokenization', url: '/tokenization', icon: Layers },
    { title: 'Investment Portal', url: '/investment-portal', icon: Building },
    {
      title: 'My Digital Asset Offering',
      url: '/digital-assets',
      icon: Grid3X3,
      isDisabled: true,
    },
    {
      title: "Investor's Management",
      url: '/investor-management',
      icon: Users,
    },
    {
      title: 'Investment Requests',
      url: '/investment-requests',
      icon: TrendingUp,
      isDisabled: true,
    },
    { title: 'Asset Management', url: '/asset-management', icon: Folder },
    { title: 'Explore Projects', url: '/explore-projects', icon: Compass },
    { title: 'Swap', url: '/swap', icon: ArrowUpDown },
    { title: 'KYC', url: '/kyc', icon: FileText },
    { title: 'Account', url: '/account', icon: UserCircle },
  ];

  const clientItems: NavigationItem[] = [
    { title: 'Home', url: '/home', icon: Home },
    { title: 'Explore Projects', url: '/explore-projects', icon: Magnet },
    { title: 'KYC', url: '/kyc', icon: IdCard },
    { title: 'Swap', url: '/swap', icon: ArrowUpDown, isDisabled: true },
    {
      title: 'Create Project',
      url: '/create-project',
      icon: Rocket,
      isDisabled: true,
    },
    {
      title: 'Tokenization',
      url: '/tokenization',
      icon: Layers,
      isDisabled: true,
    },
    {
      title: 'Investment Portal',
      url: '/investment-portal',
      icon: Landmark,
      isDisabled: true,
    },
    { title: 'Account', url: '/account', icon: UserCircle },
  ];

  return model === 'client' ? clientItems : fullItems;
}

function Navigation({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();

  const handleItemClick = (item: NavigationItem, e: React.MouseEvent) => {
    if (item.isDisabled) {
      e.preventDefault();
    }
  };

  return (
    <nav className="space-y-2">
      {items.map((item) => {
        const IconComponent = item.icon;
        const isActive = pathname === item.url;

        return (
          <div key={item.url} className="relative chakra-petch">
            <Link
              href={item.isDisabled ? '#' : item.url}
              onClick={(e) => handleItemClick(item, e)}
              aria-disabled={item.isDisabled}
              tabIndex={item.isDisabled ? -1 : 0}
              className={`
                w-full h-12 px-4 rounded-lg transition-all duration-200 ease-in-out
                flex items-center gap-3 group relative
                ${
                  item.isDisabled
                    ? 'text-gray-600 cursor-not-allowed opacity-60'
                    : isActive
                      ? 'bg-card-selected-bg text-primary'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
                }
              `}
            >
              <IconComponent className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium truncate">{item.title}</span>
              {item.isDisabled && <Lock className="w-5 h-5 text-yellow-500" />}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

export default function AppSidebar({
  className = '',
  model = 'client',
}: AppSidebarProps) {
  const navigationItems = getNavigationItems(model);

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
