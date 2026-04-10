/**
 * Short-lived client hint that Particle verification succeeded recently.
 * Used to avoid flashing the sign-in UI / modal while Wagmi reconnects after refresh.
 * Cleared on explicit disconnect. Not a security boundary — Particle + Wagmi own real persistence.
 */
const STORAGE_KEY = 'infrafund_particle_auth_ok_at';

/** How long we treat the user as “just signed in” for UX (reconnect grace on /login). */
export const PARTICLE_RECENT_AUTH_MAX_MS = 5 * 60 * 1000;

/** Extra spinner on /login when disconnected but we saw a verified session recently. */
export const PARTICLE_RECENT_AUTH_DISCONNECT_HOLD_MS = 15_000;

export function markParticleAuthOk(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* private mode / SSR */
  }
}

export function clearParticleAuthOk(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

export function isRecentParticleAuthOk(
  maxAgeMs: number = PARTICLE_RECENT_AUTH_MAX_MS
): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return false;
    }
    const t = Number(raw);
    if (!Number.isFinite(t)) {
      return false;
    }
    return Date.now() - t < maxAgeMs;
  } catch {
    return false;
  }
}
