'use client';

import { OpenfortButton } from '@openfort/react';
import infrafund from '@/../public/assets/svg/infrafund.svg';
import Image from 'next/image';

export default function Login() {
  return (
    <div className="flex w-full justify-center items-center">
      <div className="flex max-w-md flex-col items-center gap-8 rounded-[32px] border border-[#263247] bg-[#111827]/70 p-10">
        <Image src={infrafund} alt="InfraFund" />
        <div className="space-y-3 text-center text-white">
          <h1 className="text-3xl font-bold">Sign in to InfraFund</h1>
          <p className="text-sm text-[#C7CAD5]">
            Continue with your Openfort account to access the app.
          </p>
        </div>
        <OpenfortButton label="Continue" showAvatar />
      </div>
    </div>
  );
}
