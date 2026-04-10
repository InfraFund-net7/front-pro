'use client';

import {
  hasExternalWalletSupport,
  isParticleConfigured,
  missingParticleEnvKeys,
} from '@/lib/particle-config';
import { useAccount, useModal } from '@particle-network/connectkit';
import { Bell, Headset, Wallet } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { CustomButton } from './ui/custom-button';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/kyc': 'KYC',
  '/explore-projects': 'Explore Projects',
  '/projects': 'Projects',
  '/settings': 'Settings',
};

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function ParticleActionButton() {
  if (!isParticleConfigured) {
    return (
      <CustomButton
        variant="outlined"
        className="w-fit h-[40px] flex justify-center items-center gap-2 text-primary"
        disabled
      >
        <Wallet size={24} />
        <span className="text-sm font-semibold">Particle setup required</span>
      </CustomButton>
    );
  }

  return <ConfiguredParticleActionButton />;
}

function ConfiguredParticleActionButton() {
  const { setOpen } = useModal();
  const { address, isConnected } = useAccount();

  return (
    <CustomButton
      variant="outlined"
      className="w-fit h-[40px] flex justify-center items-center gap-2 text-primary"
      onClick={() => setOpen(true)}
    >
      <Wallet size={24} />
      <span className="text-sm font-semibold">
        {isConnected && address ? truncateAddress(address) : 'Login / Connect'}
      </span>
    </CustomButton>
  );
}

export default function Header() {
  const pathname = usePathname();
  const pageTitle = routeTitles[pathname] || 'Page';
  const particleStatus = !isParticleConfigured
    ? `${missingParticleEnvKeys.join(', ')} missing`
    : hasExternalWalletSupport
      ? 'Particle ready'
      : 'Social login ready';

  return (
    <div className="flex h-16 shrink-0 justify-between items-center sticky top-0 z-20 rounded-lg mb-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-normal text-white leading-2">
          Hi sherv
          <span className="text-[#8087A3] text-base font-normal"> - Guest</span>
        </span>
        <span className="text-[40px] font-bold text-white">{pageTitle}</span>
      </div>

      <div className="flex justify-center items-center gap-4">
        <Headset size={24} className="text-white cursor-pointer" />
        <Bell size={24} className="text-white cursor-pointer" />
        <div className="flex flex-col items-end gap-1">
          <ParticleActionButton />
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#8087A3]">
            {particleStatus}
          </span>
        </div>
        <div className="w-12 h-12 rounded-full bg-[#263247] flex justify-center items-center text-white">
          S
        </div>
      </div>
    </div>
  );
}
