'use client';

interface BackendLoginResponse {
  user_id: string;
  access_token: string;
  expires_at: string;
}

interface BackendCheckResponse {
  exists: boolean;
}

interface BackendCountriesResponse {
  items: BackendCountryRecord[];
}

interface BackendCountryRecord {
  ID: number;
  Name: string;
  Iso: string;
  Iso3: string;
  Code: number;
  PhoneCode: number;
}

export interface CountryOption {
  id: number;
  name: string;
  iso?: string;
  iso3?: string;
  code?: number;
  phoneCode?: number;
}

interface OpenfortExchangePayload {
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  phone_number?: string;
  email?: string;
  type?: 'individual' | 'organization';
  role?: string;
}

interface NonResidentIndividualPayload {
  first_name: string;
  last_name: string;
  email: string;
  country_id: number;
}

interface NonResidentCompanyPayload {
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  country_id: number;
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
  detail?: string;
}

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');
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
      message = errorBody.message || errorBody.detail || message;
    } catch {}

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  const body = (await response.json()) as SuccessResponse<T>;
  return body.data;
}

function normalizeCountry(country: BackendCountryRecord): CountryOption {
  return {
    id: country.ID,
    name: country.Name,
    iso: country.Iso,
    iso3: country.Iso3,
    code: country.Code,
    phoneCode: country.PhoneCode,
  };
}

export async function checkOpenfortUser(openfortAccessToken: string) {
  return request<BackendCheckResponse>('auth/openfort/check', {
    method: 'GET',
    accessToken: openfortAccessToken,
  });
}

export async function exchangeOpenfortSession(
  openfortAccessToken: string,
  body: OpenfortExchangePayload = {}
) {
  return request<BackendLoginResponse>('auth/openfort/exchange', {
    method: 'POST',
    accessToken: openfortAccessToken,
    body: JSON.stringify(body),
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

export async function getCountries() {
  const response = await request<BackendCountriesResponse>(
    'locations/countries',
    {
      method: 'GET',
    }
  );

  return response.items
    .map(normalizeCountry)
    .filter((country) => country.id > 0 && country.name);
}

export async function submitNonResidentIndividual(
  payload: NonResidentIndividualPayload,
  captchaToken: string
) {
  await request<null>('non-resident-waitlist/individual', {
    method: 'POST',
    headers: {
      'X-Captcha-Token': captchaToken,
    },
    body: JSON.stringify(payload),
  });
}

export async function submitNonResidentCompany(
  payload: NonResidentCompanyPayload,
  captchaToken: string
) {
  await request<null>('non-resident-waitlist/company', {
    method: 'POST',
    headers: {
      'X-Captcha-Token': captchaToken,
    },
    body: JSON.stringify(payload),
  });
}

export async function logoutBackendSession() {
  await request<null>('auth/logout', {
    method: 'POST',
  });
}
