'use client';

import AutoWalletRegister from '@/components/AutoWalletRegister';
import React, { useEffect, useState } from 'react';
import CardView from '../ui/card-view';
import infrafund from '@/../public/assets/svg/infrafund.svg';
import Image from 'next/image';

interface SurveyData {
  role: string;
  type: string;
  confirm_tos: boolean;
  first_name?: string;
  last_name?: string;
  phone_number: string;
  email: string;
  contact_fullname?: string;
  company_name?: string;
}

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
      console.warn(`⚠️ Failed to parse cookie "${name}"`, e);
    }
  }

  return null;
};

const clearDomainCookie = (name: string) => {
  document.cookie = `${name}=; Path=/; Domain=.infrafund.test; Max-Age=0; SameSite=Lax`;
};

export default function Login() {
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 Reading survey_data cookie from .infrafund.test...');
    const rawData = getDomainCookie('survey_data');

    if (rawData) {
      const payload: SurveyData = {
        role: rawData.role || "",
        type: rawData.type || "individual",
        confirm_tos: rawData.confirm_tos || false,
        first_name: rawData.type === "individual" ? rawData.first_name || "" : undefined,
        last_name: rawData.type === "individual" ? rawData.last_name || "" : undefined,
        phone_number: rawData.phone_number || "",
        email: rawData.email || "",
        contact_fullname: rawData.type === "organization" ? rawData.contact_fullname || "" : undefined,
        company_name: rawData.type === "organization" ? rawData.company_name || "" : undefined,
      };

      console.log('✅ Standardized payload:', payload);
      setSurveyData(payload);
      clearDomainCookie('survey_data');
    } else {
      console.log('❌ No survey_data found in cookies.');
    }

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center">
        <CardView width="547px" height='500px' className="flex flex-col items-center justify-center">
          <div className='w-full h-fit flex justify-center items-center'>
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4" />
          </div>
          <p className="text-gray-600">load survey datas</p>
        </CardView>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center">
      <CardView
        width="547px"
        height="500px"
        className="p-6 text-white flex flex-col justify-center items-center md:p-8"
      >
        <div className="w-full h-full flex justify-center items-center">
          <Image src={infrafund} alt="InfraFund" />
        </div>

        <main className="w-full max-w-3xl mx-auto space-y-10 overflow-y-auto">
          {/* {surveyData ? ( */}
          <AutoWalletRegister />
          {/* ) : ( */}
          {/* <div className="text-white rounded-xl p-6 text-center">
              <h2 className="ibm-plex-mono text-xl font-semibold mb-3">
                Access Denied — Survey Required
              </h2>
              <p className="chakra-petch mb-4 leading-relaxed">
                To personalize your experience and grant secure access to the InfraFund dashboard, ...
              </p>
              <p className="chakra-petch font-medium mb-6">
                You must complete the survey <strong>and log in</strong> to unlock full dashboard access.
              </p>
              <a
                href="http://infrafund.test:3000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg chakra-petch shadow-md hover:shadow-lg transition"
              >
                Go to Survey & Sign In
              </a>
              <p className="mt-4 text-xs chakra-petch">
                After submission, you’ll be moved back here automatically.
              </p>
            </div> */}
          {/* )} */}
        </main>
      </CardView>
    </div>

  );
}
