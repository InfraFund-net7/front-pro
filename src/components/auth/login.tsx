'use client';

import AutoWalletRegister, {
  type SurveyData,
} from '@/components/AutoWalletRegister';
import infrafund from '@/../public/assets/svg/infrafund.svg';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import CardView from '../ui/card-view';

const getDomainCookie = (name: string): SurveyData | null => {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    try {
      const raw = parts[1].split(';')[0];
      const decoded = decodeURIComponent(raw);
      return JSON.parse(decoded) as SurveyData;
    } catch {
      return null;
    }
  }

  return null;
};

const clearDomainCookie = (name: string) => {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
};

export default function Login() {
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [isReady, setIsReady] = useState(false);

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

      setSurveyData(payload);
      clearDomainCookie('survey_data');
    }

    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="w-full flex justify-center items-center">
        <CardView
          width="547px"
          height="320px"
          className="flex flex-col items-center justify-center"
        >
          <div className="w-full h-fit flex justify-center items-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4" />
          </div>
          <p className="text-gray-600">Loading login flow...</p>
        </CardView>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center">
      <CardView
        width="547px"
        height="auto"
        className="w-full max-w-[547px] p-6 text-white flex flex-col justify-center items-center md:p-8"
      >
        <div className="w-full h-full flex justify-center items-center">
          <Image src={infrafund} alt="InfraFund" />
        </div>

        <main className="w-full max-w-3xl mx-auto space-y-8 overflow-y-auto">
          <AutoWalletRegister surveyData={surveyData} />
        </main>
      </CardView>
    </div>
  );
}
