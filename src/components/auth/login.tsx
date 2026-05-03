'use client';

import { OpenfortButton } from '@openfort/react';
import infrafund from '@/../public/assets/svg/infrafund.svg';
import Image from 'next/image';
import type { ReactNode } from 'react';

interface LoginProps {
  title?: string;
  description?: ReactNode;
  buttonLabel?: string;
}

export default function Login({
  title = 'Sign in to InfraFund',
  description = 'Continue with your Openfort account to sign in or create your InfraFund account.',
  buttonLabel = 'Continue with Openfort',
}: LoginProps) {
  return (
    <div className="flex w-full justify-center items-center">
      <div className="flex max-w-lg flex-col items-center gap-8 rounded-[32px] border border-[#263247] bg-[#111827]/70 p-10">
        <Image src={infrafund} alt="InfraFund" />
        <div className="space-y-3 text-center text-white">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-sm text-[#C7CAD5]">{description}</p>
        </div>
        <OpenfortButton label={buttonLabel} />
      </div>
    </div>
  );
}
