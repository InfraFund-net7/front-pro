'use client';

const LOGOUT_MARKER_KEY = 'infrafund:openfort-logout-in-progress';
const LOGOUT_MARKER_TTL_MS = 30_000;
const CALLBACK_KEYS = [
  'openfortAuthProviderUI',
  'access_token',
  'user_id',
  'error',
] as const;

type OAuthCallbackState =
  | 'oauth_login_callback'
  | 'stale_oauth_params'
  | 'none';

function getWindowLocation() {
  return typeof window === 'undefined' ? null : window.location;
}

function readLogoutMarkerTimestamp() {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(LOGOUT_MARKER_KEY);
  if (!raw) return null;

  const timestamp = Number(raw);
  if (!Number.isFinite(timestamp)) {
    window.sessionStorage.removeItem(LOGOUT_MARKER_KEY);
    return null;
  }

  if (Date.now() - timestamp > LOGOUT_MARKER_TTL_MS) {
    window.sessionStorage.removeItem(LOGOUT_MARKER_KEY);
    return null;
  }

  return timestamp;
}

export function markOpenfortLogoutInProgress() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(LOGOUT_MARKER_KEY, String(Date.now()));
}

export function clearOpenfortLogoutInProgress() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(LOGOUT_MARKER_KEY);
}

export function classifyOpenfortOAuthCallback(): OAuthCallbackState {
  const location = getWindowLocation();
  if (!location) return 'none';

  const params = new URLSearchParams(location.search);
  const hasProvider = params.has('openfortAuthProviderUI');
  const hasAccessToken = params.has('access_token');
  const hasUserId = params.has('user_id');
  const isCallbackShaped = hasProvider && hasAccessToken && hasUserId;

  if (!isCallbackShaped) {
    return 'none';
  }

  return readLogoutMarkerTimestamp()
    ? 'stale_oauth_params'
    : 'oauth_login_callback';
}

export function sanitizeOpenfortOAuthCallbackUrl() {
  const location = getWindowLocation();
  if (!location) return false;

  const url = new URL(location.href);
  let changed = false;

  for (const key of CALLBACK_KEYS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }

  if (changed) {
    window.history.replaceState({}, document.title, url.toString());
  }

  return changed;
}
