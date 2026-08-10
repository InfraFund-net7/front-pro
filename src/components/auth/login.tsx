'use client';

import { usePrivy } from '@privy-io/react-auth';
import infrafund from '@/../public/assets/svg/infrafund.svg';
import { BuildInfo } from '@/components/build-info';
import Image from 'next/image';
import type { ReactNode } from 'react';

interface LoginProps {
  title?: string;
  description?: ReactNode;
  buttonLabel?: string;
}

export default function Login({
  title = 'Sign in to InfraFund',
  description = 'Continue with your account to sign in or create your InfraFund account.',
  buttonLabel = 'Continue',
}: LoginProps) {
  const { login, ready } = usePrivy();

  return (
    <div className="flex w-full justify-center items-center">
      <div className="flex max-w-lg flex-col items-center gap-8 rounded-[32px] border border-[#263247] bg-[#111827]/70 p-10">
        <Image src={infrafund} alt="InfraFund" />
        <div className="space-y-3 text-center text-white">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-sm text-[#C7CAD5]">{description}</p>
        </div>
        <div className="flex w-full flex-col items-center gap-8">
          <button
            onClick={login}
            disabled={!ready}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonLabel}
          </button>
          <BuildInfo className="w-full text-center" />
        </div>
      </div>
    </div>
  );
}
