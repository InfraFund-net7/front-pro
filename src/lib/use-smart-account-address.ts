'use client';

import { useEffect, useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import type { Address } from 'viem';
import {
  getSmartAccountAddress,
  smartAccountChain,
} from '@/lib/biconomy-smart-account';

type SmartAccountStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useSmartAccountAddress() {
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
  const [address, setAddress] = useState<Address | null>(null);
  const [status, setStatus] = useState<SmartAccountStatus>('idle');

  useEffect(() => {
    if (!embeddedWallet) {
      setAddress(null);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    getSmartAccountAddress(embeddedWallet)
      .then((derivedAddress) => {
        if (cancelled) return;
        setAddress(derivedAddress);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setAddress(null);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [embeddedWallet]);

  return { address, chainId: smartAccountChain.id, status };
}
