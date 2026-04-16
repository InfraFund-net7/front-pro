'use client';

import { Bell, Headset, Wallet } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAccount, useParticleAuth } from '@particle-network/connectkit';
import { CustomButton } from './ui/custom-button';
import { ConnectWallet } from './connectwallet/connect-wallet-modal';

const USER_ROLE_STORAGE_KEY = 'infrafund_user_role';
const USER_ROLE_UPDATED_EVENT = 'infrafund:user-role-updated';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/kyc': 'KYC',
  '/explore-projects': 'Explore Projects',
  '/projects': 'Projects',
  '/settings': 'Settings',
  '/sign-out': 'Sign out',
};

function formatRoleLabel(role: string): string {
  const normalized = role.trim().toLowerCase();
  if (!normalized) return 'Member';
  const roleMap: Record<string, string> = {
    investor: 'Investor',
    contractor: 'Contractor',
    client: 'Project Developer',
    dao: 'Governance Member',
  };
  return (
    roleMap[normalized] ??
    normalized
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(' ')
  );
}

export default function Header() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState<string>('Guest');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const account = useAccount();
  const { getUserInfo } = useParticleAuth();
  const pageTitle = routeTitles[pathname] || 'Page';
  const roleLabel = useMemo(
    () =>
      account.status === 'connected'
        ? formatRoleLabel(selectedRole)
        : 'Guest',
    [account.status, selectedRole]
  );
  const avatarLabel = useMemo(
    () => userName.trim().charAt(0).toUpperCase() || 'G',
    [userName]
  );

  useEffect(() => {
    const syncRole = () => {
      const storedRole = localStorage.getItem(USER_ROLE_STORAGE_KEY) ?? '';
      setSelectedRole(storedRole);
    };
    syncRole();
    window.addEventListener('storage', syncRole);
    window.addEventListener(USER_ROLE_UPDATED_EVENT, syncRole);
    return () => {
      window.removeEventListener('storage', syncRole);
      window.removeEventListener(USER_ROLE_UPDATED_EVENT, syncRole);
    };
  }, []);

  useEffect(() => {
    const storedRole = localStorage.getItem(USER_ROLE_STORAGE_KEY) ?? '';
    setSelectedRole(storedRole);
  }, [account.status, pathname]);

  useEffect(() => {
    let cancelled = false;

    const readUserName = async () => {
      if (account.status !== 'connected') {
        setUserName('Guest');
        return;
      }

      // Prefer a friendly name from Particle user profile when available.
      try {
        const info = (await Promise.resolve(getUserInfo())) as
          | Record<string, unknown>
          | undefined;
        const profileName =
          (typeof info?.name === 'string' && info.name.trim()) ||
          (typeof info?.nickname === 'string' && info.nickname.trim()) ||
          (typeof info?.email === 'string' && info.email.trim().split('@')[0]) ||
          '';
        if (!cancelled && profileName) {
          setUserName(profileName);
          return;
        }
      } catch {
        // Fall back to wallet address label below.
      }

      const fallbackAddress =
        account.status === 'connected' ? account.address : undefined;
      if (!cancelled && fallbackAddress) {
        setUserName(`${fallbackAddress.slice(0, 6)}...${fallbackAddress.slice(-4)}`);
      }
    };

    void readUserName();
    return () => {
      cancelled = true;
    };
  }, [account, getUserInfo]);

  return (
    <div className="flex h-16 shrink-0 justify-between items-center sticky top-0 z-20 rounded-lg mb-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-normal text-white leading-2">
          Hi {userName}
          <span className="text-[#8087A3] text-base font-normal">
            {' '}
            - {roleLabel}
          </span>
        </span>
        <span className="text-[40px] font-bold text-white">{pageTitle}</span>
      </div>

      <div className="flex justify-center items-center gap-4">
        <Headset size={24} className="text-white cursor-pointer" />
        <Bell size={24} className="text-white cursor-pointer" />
        <CustomButton
          variant="outlined"
          className="w-fit h-[40px] flex justify-center items-center gap-2 text-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <Wallet size={24} />
          <span className="text-sm font-semibold">Connect Wallet</span>
        </CustomButton>
        <div className="w-12 h-12 rounded-full bg-[#263247] flex justify-center items-center text-white">
          {avatarLabel}
        </div>
      </div>
      <ConnectWallet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
