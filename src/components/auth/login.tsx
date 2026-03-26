'use client';

import React, { useEffect } from 'react';
import { useUser } from '@openfort/react';
import { OpenfortButton } from '@openfort/react';
import { useRouter } from 'next/navigation';
import infrafund from '@/../public/assets/svg/infrafund.svg';
import Image from 'next/image';

export default function Login() {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/home');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="w-full flex justify-center items-center">
      <div className="flex flex-col items-center gap-8 p-8">
        <Image src={infrafund} alt="InfraFund" />
        <OpenfortButton />
      </div>
    </div>
  );
}
