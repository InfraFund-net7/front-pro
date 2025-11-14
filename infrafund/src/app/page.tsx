'use client';

import AutoWalletRegister from '@/components/AutoWalletRegister';
import React, { useEffect, useState } from 'react';

const getDomainCookie = (name: string): any | null => {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    try {
      const raw = parts[1].split(';')[0];
      const decoded = decodeURIComponent(raw);
      return JSON.parse(decoded);
    } catch (e) {
      console.warn(`⚠️ Failed to parse cookie "${name}"`, e);
    }
  }
  return null;
};

const clearDomainCookie = (name: string) => {
  document.cookie = `${name}=; Path=/; Domain=.infrafund.test; Max-Age=0; SameSite=Lax`;
};

export default function DashboardPage() {
  const [surveyData, setSurveyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 Reading survey_data cookie from .infrafund.test...');
    const rawData = getDomainCookie('survey_data');

    if (rawData) {
      const payload = {
        role: rawData.role || "",
        type: rawData.type || "individual",
        confirm_tos: rawData.confirm_tos || false,
        first_name: rawData.type === "individual" ? rawData.first_name || "" : "",
        last_name: rawData.type === "individual" ? rawData.last_name || "" : "",
        phone_number: rawData.phone_number || "",
        email: rawData.email || "",
        contact_fullname: rawData.type === "organization" ? rawData.contact_fullname || "" : "",
        company_name: rawData.type === "organization" ? rawData.company_name || "" : "",
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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-600">در حال بارگذاری داده‌های survey...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 md:p-12">
      <header className="mb-10 text-center">
        <h1 className="ibm-plex-mono text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          InfraFund Dashboard
        </h1>
        <p className="chakra-petch text-lg text-gray-600">
          {surveyData
            ? `خوش آمدید، ${surveyData.first_name || surveyData.contact_fullname}!`
            : 'داده‌ای از survey دریافت نشد.'}
        </p>
      </header>

      <main className="max-w-3xl mx-auto space-y-10">
        {surveyData ? (
          <>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="ibm-plex-mono text-xl font-semibold text-gray-800 mb-4">
                اطلاعات ثبت‌شده در Survey
              </h2>
              <div className="space-y-3 text-gray-700">
                <div><span className="font-medium">نقش:</span> <span className="chakra-petch">{surveyData.role}</span></div>
                <div><span className="font-medium">نوع کاربر:</span> <span className="chakra-petch">{surveyData.type === 'individual' ? 'فردی' : 'سازمانی'}</span></div>
                <div><span className="font-medium">ایمیل:</span> <span className="chakra-petch">{surveyData.email}</span></div>
                {surveyData.first_name && (
                  <div><span className="font-medium">نام کامل:</span> <span className="chakra-petch">{surveyData.first_name} {surveyData.last_name}</span></div>
                )}
                {surveyData.contact_fullname && (
                  <div><span className="font-medium">نام مخاطب:</span> <span className="chakra-petch">{surveyData.contact_fullname}</span></div>
                )}
                {surveyData.company_name && (
                  <div><span className="font-medium">نام شرکت:</span> <span className="chakra-petch">{surveyData.company_name}</span></div>
                )}
                <div><span className="font-medium">شماره تماس:</span> <span className="chakra-petch">{surveyData.phone_number || '—'}</span></div>
              </div>
            </div>

            <div className="mt-10">
              <AutoWalletRegister surveyData={surveyData} />
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <h2 className="ibm-plex-mono text-xl font-semibold text-yellow-800 mb-3">
              Access Denied — Survey Required
            </h2>
            <p className="chakra-petch text-yellow-700 mb-4 max-w-2xl mx-auto leading-relaxed">
              To personalize your experience and grant secure access to the InfraFund dashboard, we require your profile details via the onboarding survey.
              This step verifies your role, organization, and contact information — essential for project collaboration and fund-raising workflows.
            </p>
            <p className="chakra-petch text-yellow-800 font-medium mb-6">
              You must complete the survey <strong>and log in</strong> to unlock full dashboard access.
            </p>
            <a
              href="http://infrafund.test:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-300 hover:bg-primary text-white font-semibold rounded-lg chakra-petch shadow-md hover:shadow-lg transition"
            >
              Go to Survey & Sign In 
            </a>
            <p className="mt-4 text-xs text-yellow-600 chakra-petch">
              After submission, you’ll be redirected back here automatically.
            </p>
          </div>
        )}
      </main>

      <footer className="mt-16 text-center text-gray-500 text-sm chakra-petch">
        تست لوکال — بدون نیاز به backend | InfraFund
      </footer>
    </div>
  );
}
