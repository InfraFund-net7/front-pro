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

interface ProjectMilestonePayload {
  name: string;
  cost?: string;
  end_date?: string;
}

interface ProjectDocumentPayload {
  file_name?: string;
  mime_type?: string;
  size_bytes?: number;
}

export interface ProjectResponse {
  id: string;
  name: string | null;
  description: string | null;
  type: string;
  infrastructure_type: string | null;
  project_status: string | null;
  crowdfunding_model: string;
  submission_status: string;
  current_step: string;
  digital_asset_symbol: string | null;
  target_investment_amount: string | null;
  target_investment_currency: string;
  raised_before: boolean | null;
  website_url: string | null;
  social_url: string | null;
  contact: {
    first_name: string;
    last_name: string;
    email: string;
    title: string;
    phone_number: string | null;
  } | null;
  campaign: {
    token_name: string | null;
    digital_asset_supply: string | null;
    price: string | null;
    currency: string;
    min_raise: string | null;
    max_raise: string | null;
    min_contribution: string | null;
    max_contribution: string | null;
    start_date: string | null;
    end_date: string | null;
    general_contractor_wallet_address: string | null;
    pledge_address: string | null;
  } | null;
  documents: Array<ProjectDocumentPayload & { id: string; kind: string }>;
  milestones: Array<{
    id: string;
    name: string;
    cost: string | null;
    end_date: string | null;
    sort_order: number;
  }>;
}

export interface ProjectContactPayload {
  first_name: string;
  last_name: string;
  email: string;
  title: string;
  phone_number?: string;
}

export interface ProjectInformationPayload {
  name: string;
  description: string;
  target_investment_amount: string;
  infrastructure_type: string;
  project_status: string;
  raised_before: boolean;
  website_url?: string;
  social_url?: string;
  proposal_document?: ProjectDocumentPayload;
}

interface ProjectMilestonesPayload {
  milestones: ProjectMilestonePayload[];
}

export interface ProjectCampaignPayload {
  token_name: string;
  digital_asset_supply: string;
  price: string;
  currency: string;
  min_raise: string;
  max_raise: string;
  min_contribution: string;
  max_contribution: string;
  start_date: string;
  end_date: string;
  general_contractor_wallet_address?: string;
  pledge_address?: string;
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
  fields?: Record<string, unknown>;
}

function buildUrl(path: string) {
  const normalizedPath = path.replace(/^\/+/, '');

  return `/api/v1/${normalizedPath}`;
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
      const baseMessage = errorBody.message || errorBody.detail || message;
      const fieldMessages = errorBody.fields
        ? Object.entries(errorBody.fields)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join(', ')
        : '';
      message = [baseMessage, errorBody.detail, fieldMessages]
        .filter(Boolean)
        .join(' — ');
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
  // The endpoint defaults to 10 results; ask for the full ISO country list in
  // one shot so the dropdown isn't silently truncated.
  const response = await request<BackendCountriesResponse>(
    'locations/countries?limit=300',
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

export async function createProjectDraft(accessToken: string) {
  return request<ProjectResponse>('projects', {
    method: 'POST',
    accessToken,
  });
}

export async function saveProjectContact(
  accessToken: string,
  projectId: string,
  payload: ProjectContactPayload
) {
  return request<ProjectResponse>(`projects/${projectId}/contact`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function saveProjectInformation(
  accessToken: string,
  projectId: string,
  payload: ProjectInformationPayload
) {
  return request<ProjectResponse>(`projects/${projectId}/information`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function saveProjectMilestones(
  accessToken: string,
  projectId: string,
  payload: ProjectMilestonesPayload
) {
  return request<ProjectResponse>(`projects/${projectId}/milestones`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function saveProjectCampaign(
  accessToken: string,
  projectId: string,
  payload: ProjectCampaignPayload
) {
  return request<ProjectResponse>(`projects/${projectId}/campaign`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function submitProjectDraft(
  accessToken: string,
  projectId: string
) {
  return request<ProjectResponse>(`projects/${projectId}/submit`, {
    method: 'POST',
    accessToken,
  });
}

export async function logoutBackendSession() {
  await request<null>('auth/logout', {
    method: 'POST',
  });
}

export async function deleteBackendAccount(accessToken: string) {
  await request<null>('me', {
    method: 'DELETE',
    accessToken,
  });
}
