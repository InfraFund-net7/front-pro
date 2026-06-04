'use client';

import { OpenfortButton, useUser } from '@openfort/react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export type SurveyData = {
  role: string;
  type: string;
  confirm_tos: boolean;
  first_name?: string;
  last_name?: string;
  phone_number: string;
  email: string;
  contact_fullname?: string;
  company_name?: string;
};

function parseAuthResponse(payload: unknown): {
  accessToken: string;
} | null {
  if (!payload || typeof payload !== 'object') return null;
  const body = (payload as Record<string, unknown>).body;
  if (!body || typeof body !== 'object') return null;
  const data = (body as Record<string, unknown>).data as
    | Record<string, unknown>
    | undefined;
  if (!data) return null;
  const accessToken = data.access_token;
  if (typeof accessToken !== 'string' || !accessToken) return null;
  return { accessToken };
}

function parseAxiosErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Sign-in failed';
  }

  const data = error.response?.data;
  if (typeof data === 'string' && data.trim()) {
    return data;
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message;
    }
    if (typeof record.detail === 'string' && record.detail.trim()) {
      return record.detail;
    }
    if (typeof record.title === 'string' && record.title.trim()) {
      return record.title;
    }
  }
  return error.message || 'Sign-in failed';
}

function isUserNotFoundLoginError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (error.response?.status !== 404) return false;
  const data = error.response?.data;
  const detail =
    data &&
    typeof data === 'object' &&
    'detail' in (data as Record<string, unknown>)
      ? (data as Record<string, unknown>).detail
      : '';
  const message = typeof detail === 'string' ? detail : '';
  return /user not found|register first/i.test(message);
}

function buildRegisterPayload(
  survey: SurveyData,
  userId: string,
  token: string
) {
  const type = survey.type === 'organization' ? 'organization' : 'individual';
  let firstName = survey.first_name?.trim() || '';
  let lastName = survey.last_name?.trim() || '';
  if (type === 'organization') {
    const full = survey.contact_fullname?.trim() || '';
    if (full) {
      const parts = full.split(/\s+/);
      firstName = parts[0] || 'Contact';
      lastName = parts.slice(1).join(' ') || 'Representative';
    } else {
      firstName = 'Organization';
      lastName = 'Contact';
    }
  }
  if (!firstName) firstName = 'User';
  if (!lastName) lastName = 'Name';

  return {
    uuid: userId,
    token,
    first_name: firstName,
    last_name: lastName,
    organization_name:
      type === 'organization'
        ? survey.company_name?.trim() || 'Organization'
        : '',
    phone_number: survey.phone_number || '',
    email: survey.email || '',
    type,
    role: survey.role || 'investor',
  };
}

export default function OpenfortAuthForm({
  surveyPayload,
}: {
  surveyPayload: SurveyData | null;
}) {
  const { user, isAuthenticated, isLoading, getAccessToken } = useUser();
  const router = useRouter();
  const [exchanging, setExchanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exchangedRef = useRef(false);
  const shouldRegister = Boolean(surveyPayload);
  const shouldPromptRegister =
    !shouldRegister && !!error && /register|not found/i.test(error);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || exchangedRef.current) return;

    exchangedRef.current = true;
    void (async () => {
      setExchanging(true);
      setError(null);
      try {
        const token = await getAccessToken();
        if (!token) throw new Error('Could not read OpenFort session');

        const uuid = user.id;
        const url = shouldRegister ? '/api/register' : '/api/login';
        const body = shouldRegister
          ? buildRegisterPayload(surveyPayload!, uuid, token)
          : { uuid, token };

        const res = await axios.post(url, body, { withCredentials: true });
        const parsed = parseAuthResponse(res.data);
        if (!parsed) {
          throw new Error('Unexpected response from server');
        }
        localStorage.setItem('access_token', parsed.accessToken);
        router.replace('/explore-projects');
      } catch (e: unknown) {
        exchangedRef.current = false;
        if (!shouldRegister && isUserNotFoundLoginError(e)) {
          router.replace('/register');
          return;
        }
        setError(parseAxiosErrorMessage(e));
      } finally {
        setExchanging(false);
      }
    })();
  }, [
    getAccessToken,
    isAuthenticated,
    router,
    shouldRegister,
    surveyPayload,
    user?.id,
  ]);

  if (exchanging) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-gray-400">
          {shouldRegister
            ? 'Creating your InfraFund account…'
            : 'Opening your dashboard…'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 text-left">
        <p className="break-words text-sm text-red-400">{error}</p>
        {shouldPromptRegister ? (
          <Link
            href="/register"
            className="block w-full rounded-lg border border-[#2b2f3a] py-3 text-center font-medium text-gray-200"
          >
            Go to registration
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => {
            exchangedRef.current = false;
            setError(null);
            window.location.reload();
          }}
          className="w-full rounded-lg bg-primary py-3 font-medium text-black"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold text-white">Login</h2>
          <p className="text-sm leading-relaxed text-gray-400">
            Click below to open Openfort sign in. Use your email OTP in that
            window to authenticate.
          </p>
        </div>
        <div className="flex justify-center">
          <OpenfortButton />
        </div>
        {isLoading ? <p className="text-xs text-gray-500">Loading…</p> : null}
      </div>
    );
  }

  return null;
}
