'use client';

import type React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const Home = dynamic(() => import('lucide-react').then((mod) => mod.Home), {
  ssr: false,
});
const Layers = dynamic(() => import('lucide-react').then((mod) => mod.Layers), {
  ssr: false,
});
const Building = dynamic(
  () => import('lucide-react').then((mod) => mod.Building),
  { ssr: false }
);
const Grid3X3 = dynamic(
  () => import('lucide-react').then((mod) => mod.Grid3X3),
  { ssr: false }
);
const Users = dynamic(() => import('lucide-react').then((mod) => mod.Users), {
  ssr: false,
});
const TrendingUp = dynamic(
  () => import('lucide-react').then((mod) => mod.TrendingUp),
  { ssr: false }
);
const Folder = dynamic(() => import('lucide-react').then((mod) => mod.Folder), {
  ssr: false,
});
const Compass = dynamic(
  () => import('lucide-react').then((mod) => mod.Compass),
  { ssr: false }
);
const ArrowUpDown = dynamic(
  () => import('lucide-react').then((mod) => mod.ArrowUpDown),
  { ssr: false }
);
const FileText = dynamic(
  () => import('lucide-react').then((mod) => mod.FileText),
  { ssr: false }
);
const Lock = dynamic(() => import('lucide-react').then((mod) => mod.Lock), {
  ssr: false,
});
const Rocket = dynamic(() => import('lucide-react').then((mod) => mod.Rocket), {
  ssr: false,
});
const Magnet = dynamic(() => import('lucide-react').then((mod) => mod.Magnet), {
  ssr: false,
});
const Landmark = dynamic(
  () => import('lucide-react').then((mod) => mod.Landmark),
  { ssr: false }
);
const IdCard = dynamic(() => import('lucide-react').then((mod) => mod.IdCard), {
  ssr: false,
});
const LogOut = dynamic(() => import('lucide-react').then((mod) => mod.LogOut), {
  ssr: false,
});

import infrafund from '@public/assets/svg/infrafund.svg';

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  isDisabled?: boolean;
  /** Separated from main nav (e.g. sign out). */
  sectionBreak?: boolean;
  variant?: 'default' | 'muted';
}

interface AppSidebarProps {
  className?: string;
  navigationItems?: NavigationItem[];
  model?: 'client' | 'full';
}

function fetchNavigationItems(
  model: 'client' | 'full' = 'client'
): NavigationItem[] {
  const fullItems: NavigationItem[] = [
    { title: 'Home', url: '/', icon: Home },
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
    {
      title: 'Sign out',
      url: '/sign-out',
      icon: LogOut,
      sectionBreak: true,
      variant: 'muted',
    },
  ];

  const clientItems: NavigationItem[] = [
    { title: 'Home', url: '/', icon: Home },
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
    {
      title: 'Sign out',
      url: '/sign-out',
      icon: LogOut,
      sectionBreak: true,
      variant: 'muted',
    },
  ];

  return model === 'client' ? clientItems : fullItems;
}

function Navigation({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();

  const handleItemClick = (item: NavigationItem, e: React.MouseEvent) => {
    if (item.isDisabled) {
      e.preventDefault();
      return;
    }
    console.log(`Navigating to: ${item.url}`);
  };

  return (
    <nav className="space-y-2">
      {items.map((item, index) => {
        const IconComponent = item.icon;
        const isActive = pathname === item.url;

        const mutedActive =
          item.variant === 'muted' && isActive && !item.isDisabled;
        const linkTone = item.isDisabled
          ? 'text-gray-600 cursor-not-allowed opacity-60'
          : mutedActive
            ? 'bg-red-950/35 text-red-300 border border-red-500/25'
            : item.variant === 'muted' && !isActive
              ? 'text-gray-500 hover:text-red-300/90 hover:bg-red-950/20'
              : isActive
                ? 'bg-card-selected-bg text-primary'
                : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50';

        return (
          <div key={index} className="relative chakra-petch">
            {item.sectionBreak ? (
              <div className="border-t border-white/10 my-3 pt-1" aria-hidden />
            ) : null}
            <Link
              href={item.isDisabled ? '#' : item.url}
              onClick={(e) => handleItemClick(item, e)}
              aria-disabled={item.isDisabled}
              tabIndex={item.isDisabled ? -1 : 0}
              className={`
                w-full h-12 px-4 rounded-lg transition-all duration-200 ease-in-out
                flex items-center gap-3 group relative
                ${linkTone}
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
  const navigationItems = fetchNavigationItems(model);

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
