'use client';

import { Wallet, PlusCircle, KeySquare } from 'lucide-react';
import { Modal } from '../ui/modal';
import CardView from '../ui/card-view';
import AddWallet from '@/../public/assets/svg/add-wallet.svg';
import Image from 'next/image';
import { CustomButton } from '../ui/custom-button';
import { useState } from 'react';
import WalletConnect from './wallet-connect';
import NewWallet from './new-wallet';
interface ConnectWalletProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectWallet({ isOpen, onClose }: ConnectWalletProps) {
  const [createwallet, setCreatewallet] = useState(false);
  const [addwallet, setAddwallet] = useState(false);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      height="700px"
      width="788px"
      ModalTitle="Connect Wallet"
    >
      <p className="text-sm text-gray-400 mb-6">
        By connecting your wallet you agree to our{' '}
        <a href="#" className="text-primary hover:underline">
          Terms and Conditions
        </a>
      </p>
      {addwallet ? (
        <WalletConnect />
      ) : createwallet ? (
        <NewWallet />
      ) : (
        <>
          <CardView
            width="692px"
            height="184px"
            padding="p-6"
            className="w-full rounded-xl gap-[30px]"
          >
            <div className="flex flex-col gap-[15px]">
              <div className="flex w-full justify-start items-center gap-2">
                <Image
                  src={AddWallet}
                  width={24}
                  height={24}
                  alt="add-wallet"
                />
                <span className="text-lg font-semibold text-white">
                  I don&apos;t have a wallet
                </span>
              </div>
              <p className="text-sm text-[#8087A3] font-medium">
                New to this? Create a wallet swiftly and securely using our
                INFRAFUND wallet
              </p>
            </div>
            <CustomButton
              variant="filled"
              className="w-fit flex gap-2"
              onClick={() => setCreatewallet(true)}
            >
              <PlusCircle width={20} height={20} />
              <span className="text-sm text-black font-semibold">
                Create one
              </span>
            </CustomButton>
          </CardView>

          <CardView
            width="692px"
            height="184px"
            padding="p-6"
            className="w-full rounded-xl gap-[30px]"
          >
            <div className="flex flex-col gap-[15px]">
              <div className="flex items-center gap-2">
                <KeySquare width={24} height={24} className="text-primary" />
                <span className="text-lg font-semibold text-white">
                  I already have a wallet
                </span>
              </div>
              <p className="text-sm text-[#8087A3] mb-4">
                Connect your existing wallet to proceed
              </p>
            </div>
            <CustomButton
              variant="filled"
              className="w-fit flex justify-center items-center gap-2"
              onClick={() => setAddwallet(true)}
            >
              <Wallet width={24} height={24} />
              <span className="text-sm font-semibold text-black">
                Connect wallet
              </span>
            </CustomButton>
          </CardView>
        </>
      )}
      <p className="text-sm text-[#C7CAD5] text-center mt-4">
        New to crypto? Get all the information you need{' '}
        <a href="#" className="text-primary hover:underline">
          here
        </a>
      </p>
    </Modal>
  );
}
