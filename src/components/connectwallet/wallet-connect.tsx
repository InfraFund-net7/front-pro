'use client';

import React from 'react';
import CardView from '../ui/card-view';
import Image from 'next/image';
import MagicLink from '@public/assets/svg/magic-link.svg';
import walletC from '@public/assets/svg/wallet-connect.svg';
import metamask from '@public/assets/svg/meta-mask.svg';
import aurox from '@public/assets/svg/aurox.svg';

// Wallet connect component
export default function WalletConnect() {
  const wallets = [
    {
      ConnectWallet: '',
      title: 'Magic Link',
      icon: MagicLink,
      description:
        'Access the power of Web3 without installing a wallet. Magic Link is a secure, virtual wallet that allows you to interact with Web3 applications.',
    },
    {
      ConnectWallet: '',
      title: 'WalletConnect',
      icon: walletC,
      description:
        'Before selecting WalletConnect. please ensure you’ve chosen BINANCE SMART CHAIN (BSC) network in your wallet.',
    },
    {
      ConnectWallet: '',
      title: 'Metamask',
      icon: metamask,
      description: '',
    },
    {
      ConnectWallet: '',
      title: 'Aurox Wallet',
      icon: aurox,
      description: '',
    },
  ];
  return (
    <div className="w-full h-fit flex flex-col gap-4">
      {wallets.map((item) => (
        <React.Fragment key={item.title}>
          <CardView
            height="h-fit"
            padding="p-6"
            BackgroundColor="bg-[#131C2F]"
            className="gap-4 rounded-xl border border-r-card-selected-bg cursor-pointer"
          >
            <div className="flex gap-4 justify-center items-center">
              <Image src={item.icon} width={40} height={40} alt={item.title} />
              <span className="text-lg font-semibold text-white">
                {item.title}
              </span>
            </div>
            {item.description === '' ? null : (
              <p className="text-sm font-medium text-[#8087A3]">
                {item.description}
              </p>
            )}
          </CardView>
        </React.Fragment>
      ))}
    </div>
  );
}
