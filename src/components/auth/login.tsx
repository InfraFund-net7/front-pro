'use client';

import OpenfortAuthForm, {
  type SurveyData,
} from '@/components/auth/openfort-auth-form';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import CardView from '../ui/card-view';
import infrafund from '@public/assets/svg/infrafund.svg';

const USER_ROLE_STORAGE_KEY = 'infrafund_user_role';
const USER_ROLE_UPDATED_EVENT = 'infrafund:user-role-updated';

const getDomainCookie = (name: string): SurveyData | null => {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    try {
      const raw = parts[1].split(';')[0];
      const decoded = decodeURIComponent(raw);
      return JSON.parse(decoded) as SurveyData;
    } catch (e) {
      console.warn(`Failed to parse cookie "${name}"`, e);
    }
  }

  return null;
};

const clearDomainCookie = (name: string) => {
  const domainAttr = process.env.NEXT_PUBLIC_SURVEY_COOKIE_DOMAIN
    ? `; Domain=${process.env.NEXT_PUBLIC_SURVEY_COOKIE_DOMAIN}`
    : '';
  document.cookie = `${name}=; Path=/${domainAttr}; Max-Age=0; SameSite=Lax`;
};

export default function Login() {
  const [surveyPayload, setSurveyPayload] = useState<SurveyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const rawData = getDomainCookie('survey_data');

    if (rawData) {
      const payload: SurveyData = {
        role: rawData.role || '',
        type: rawData.type || 'individual',
        confirm_tos: rawData.confirm_tos || false,
        first_name:
          rawData.type === 'individual' ? rawData.first_name || '' : undefined,
        last_name:
          rawData.type === 'individual' ? rawData.last_name || '' : undefined,
        phone_number: rawData.phone_number || '',
        email: rawData.email || '',
        contact_fullname:
          rawData.type === 'organization'
            ? rawData.contact_fullname || ''
            : undefined,
        company_name:
          rawData.type === 'organization'
            ? rawData.company_name || ''
            : undefined,
      };

      setSurveyPayload(payload);
      if (payload.role.trim()) {
        localStorage.setItem(USER_ROLE_STORAGE_KEY, payload.role.trim());
        window.dispatchEvent(new Event(USER_ROLE_UPDATED_EVENT));
      }
      clearDomainCookie('survey_data');
    } else if (pathname?.startsWith('/register')) {
      router.replace('/login');
      return;
    }

    setIsLoading(false);
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="flex w-full justify-center items-center">
        <CardView
          width="547px"
          height="500px"
          className="flex flex-col items-center justify-center"
        >
          <div className="flex h-fit w-full justify-center items-center">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <p className="text-gray-600">Loading…</p>
        </CardView>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center items-center">
      <CardView
        width="547px"
        height="500px"
        className="flex flex-col justify-center items-center p-6 text-white md:p-8"
      >
        <div className="flex h-full w-full justify-center items-center">
          <Image src={infrafund} alt="InfraFund" />
        </div>

        <main className="mx-auto mt-6 w-full max-w-3xl space-y-8 overflow-y-auto">
          <OpenfortAuthForm surveyPayload={surveyPayload} />
        </main>
      </CardView>
    </div>
  );
}
