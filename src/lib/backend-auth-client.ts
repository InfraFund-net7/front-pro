'use client';

interface BackendLoginResponse {
  user_id: string;
  access_token: string;
  expires_at: string;
}

export interface BackendMeResponse {
  user_id: string;
  openfort_user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  phone_number: string | null;
  type: string;
  role: string;
  status: string;
  kyc_verified: boolean;
  kyb_verified: boolean;
}

interface SuccessResponse<T> {
  code: string;
  data: T;
}

interface ErrorResponse {
  message?: string;
}

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    ''
  ).replace(/\/+$/, '');
}

function buildUrl(path: string) {
  const normalizedPath = path.replace(/^\/+/, '');
  const baseUrl = getApiBaseUrl();

  return baseUrl ? `${baseUrl}/${normalizedPath}` : `/v1/${normalizedPath}`;
}

async function request<T>(
  path: string,
  init: RequestInit & { accessToken?: string } = {}
) {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (init.accessToken) {
    headers.set('Authorization', `Bearer ${init.accessToken}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let message = 'Request failed';

    try {
      const errorBody = (await response.json()) as ErrorResponse;
      message = errorBody.message || message;
    } catch {}

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  const body = (await response.json()) as SuccessResponse<T>;
  return body.data;
}

export async function exchangeOpenfortSession(openfortAccessToken: string) {
  return request<BackendLoginResponse>('auth/openfort/exchange', {
    method: 'POST',
    accessToken: openfortAccessToken,
  });
}

export async function refreshBackendSession() {
  return request<BackendLoginResponse>('auth/refresh', {
    method: 'POST',
  });
}

export async function getBackendMe(accessToken: string) {
  return request<BackendMeResponse>('me', {
    method: 'GET',
    accessToken,
  });
}

export async function logoutBackendSession() {
  await request<null>('auth/logout', {
    method: 'POST',
  });
}
