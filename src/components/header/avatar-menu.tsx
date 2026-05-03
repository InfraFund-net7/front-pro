'use client';

import { useEthereumEmbeddedWallet } from '@openfort/react/ethereum';
import { Check, Copy, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthSession } from '@/components/auth/auth-session-provider';

function shortenAddress(address: string) {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function AvatarMenu() {
  const router = useRouter();
  const { backendUser, openfortUser, logout } = useAuthSession();
  const wallet = useEthereumEmbeddedWallet();
  const isWalletConnected = wallet.status === 'connected';
  const address = isWalletConnected ? wallet.address : undefined;

  const [isOpen, setIsOpen] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const email = openfortUser?.email ?? backendUser?.email ?? null;
  const avatarLabel = displayName.charAt(0).toUpperCase();
  const tooltip = isWalletConnected ? 'Connected' : 'Not connected';

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setJustCopied(true);
      window.setTimeout(() => setJustCopied(false), 1500);
    } catch {
      // Clipboard API can fail in non-secure contexts; ignore silently.
    }
  };

  const handleAccount = () => {
    setIsOpen(false);
    router.push('/account');
  };

  const handleLogout = () => {
    setIsOpen(false);
    void logout();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        title={tooltip}
        aria-label={`Account menu (${tooltip})`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="relative w-12 h-12 rounded-full bg-[#263247] flex justify-center items-center text-white cursor-pointer hover:bg-[#2F394F] transition-colors"
      >
        {avatarLabel}
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0C0C0D] ${
            isWalletConnected ? 'bg-emerald-500' : 'bg-[#5A6275]'
          }`}
          aria-hidden
        />
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-[#263247] bg-[#111827]/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-[#1F2937]">
            <p className="text-sm font-semibold text-white truncate">
              {displayName}
            </p>
            {email ? (
              <p className="text-xs text-[#8087A3] truncate mt-0.5">{email}</p>
            ) : null}
          </div>

          <div className="px-4 py-3 border-b border-[#1F2937]">
            <p className="text-xs text-[#8087A3] mb-1">Wallet</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-mono text-white">
                {address ? shortenAddress(address) : 'Not connected'}
              </span>
              {address ? (
                <button
                  type="button"
                  onClick={handleCopy}
                  title={justCopied ? 'Copied' : 'Copy address'}
                  aria-label="Copy wallet address"
                  className="p-1.5 rounded-md hover:bg-[#1F2937] text-[#8087A3] hover:text-white transition-colors cursor-pointer"
                >
                  {justCopied ? (
                    <Check size={16} className="text-emerald-400" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={handleAccount}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-[#1F2937] cursor-pointer transition-colors"
          >
            <User size={16} className="text-[#8087A3]" />
            Account
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#FCA5A5] hover:bg-[#1F2937] cursor-pointer transition-colors border-t border-[#1F2937]"
          >
            <LogOut size={16} />
            Disconnect
          </button>
        </div>
      ) : null}
    </div>
  );
}
