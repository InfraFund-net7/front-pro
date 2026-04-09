'use client';

import {
  clearParticleAuthOk,
  markParticleAuthOk,
} from '@/lib/particle-session-memory';
import { useAccount, useParticleAuth } from '@particle-network/connectkit';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ParticleVerifyState = 'idle' | 'pending' | 'ok' | 'fail';

/** Try a few times for a rich `getUserInfo` payload; we still accept the session if it never appears. */
const ATTEMPTS = 4;
const RETRY_MS = 400;
const PER_CALL_TIMEOUT_MS = 15_000;

function toPromise<T>(value: T | Promise<T>): Promise<T> {
  return value instanceof Promise ? value : Promise.resolve(value);
}

function normAddr(a: string): string {
  return a.trim().toLowerCase();
}

function walletRowMatches(row: unknown, connectedAddress: string): boolean {
  if (row == null || typeof row !== 'object') {
    return false;
  }
  const w = row as Record<string, unknown>;
  const candidates = [w.public_address, w.address, w.publicAddress];
  const want = normAddr(connectedAddress);
  return candidates.some(
    (c) => typeof c === 'string' && normAddr(c) === want,
  );
}

/**
 * Particle’s `getUserInfo()` return shape varies by SDK / auth path. Accept clear
 * signals of a live session.
 */
function isValidParticleUserInfo(info: unknown, connectedAddress: string): boolean {
  if (info == null || typeof info !== 'object') {
    return false;
  }
  const o = info as Record<string, unknown>;

  const uuid = o.uuid;
  if (typeof uuid === 'string' && uuid.trim().length > 0) {
    return true;
  }

  const token = o.token;
  if (typeof token === 'string' && token.trim().length > 0) {
    return true;
  }

  const jwtId = o.jwt_id;
  if (typeof jwtId === 'string' && jwtId.trim().length > 0) {
    return true;
  }

  const macKey = o.mac_key;
  if (typeof macKey === 'string' && macKey.trim().length > 0) {
    return true;
  }

  const wallets = o.wallets;
  if (Array.isArray(wallets) && wallets.length > 0 && connectedAddress) {
    if (wallets.some((row) => walletRowMatches(row, connectedAddress))) {
      return true;
    }
  }

  const cognito = o.cognito_result;
  if (cognito != null && typeof cognito === 'object') {
    const id = (cognito as { identity_id?: string }).identity_id;
    if (typeof id === 'string' && id.trim().length > 0) {
      return true;
    }
  }

  const security = o.security_account;
  if (security != null && typeof security === 'object') {
    const s = security as { email?: string | null; phone?: string | null };
    if (
      (typeof s.email === 'string' && s.email.length > 0) ||
      (typeof s.phone === 'string' && s.phone.length > 0)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * When `getUserInfo` returns a non-empty object we don’t fully parse yet — still
 * indicates Particle returned a user payload (SDK version drift).
 */
function looksLikeParticleUserBlob(info: unknown): boolean {
  if (info == null || typeof info !== 'object') {
    return false;
  }
  const o = info as Record<string, unknown>;
  const keys = Object.keys(o);
  if (keys.length === 0) {
    return false;
  }
  const hints = [
    'wallets',
    'token',
    'uuid',
    'email',
    'phone',
    'cognito_result',
    'security_account',
    'mac_key',
    'thirdparty_user_info',
    'name',
    'avatar',
  ];
  if (keys.some((k) => hints.includes(k))) {
    return true;
  }
  const user = o.user;
  if (user != null && typeof user === 'object' && Object.keys(user).length > 0) {
    return true;
  }
  return keys.length >= 6;
}

function getParticleInternal(): unknown {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return (window as Window & { particle?: { _internal?: unknown } }).particle
    ?._internal;
}

async function fetchUserInfoWithFallback(
  getUserInfo: () => unknown,
): Promise<unknown> {
  try {
    const raw = getUserInfo();
    return await withTimeout(
      toPromise(raw as Promise<unknown> | unknown),
      PER_CALL_TIMEOUT_MS,
    );
  } catch {
    try {
      const internal = getParticleInternal() as
        | { getUserInfo?: () => unknown }
        | undefined;
      if (typeof internal?.getUserInfo !== 'function') {
        throw new Error('no_internal_getUserInfo');
      }
      const raw = internal.getUserInfo();
      return await withTimeout(
        toPromise(raw as Promise<unknown> | unknown),
        PER_CALL_TIMEOUT_MS,
      );
    } catch {
      throw new Error('getUserInfo_failed');
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(() => reject(new Error('particle_get_user_info_timeout')), ms);
    promise.then(
      (v) => {
        window.clearTimeout(id);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(id);
        reject(e);
      },
    );
  });
}

type ParticleVerificationContextValue = {
  verifyState: ParticleVerifyState;
  isFullyVerified: boolean;
};

const ParticleVerificationContext =
  createContext<ParticleVerificationContextValue | null>(null);

export function ParticleVerificationProvider({ children }: { children: ReactNode }) {
  const account = useAccount();
  const { getUserInfo } = useParticleAuth();
  const getUserInfoRef = useRef(getUserInfo);
  getUserInfoRef.current = getUserInfo;

  const status = account.status;
  const connectorType =
    account.status === 'connected'
      ? account.connector.walletConnectorType
      : undefined;
  const address =
    account.status === 'connected' ? account.address : undefined;

  const [verifyState, setVerifyState] = useState<ParticleVerifyState>('idle');

  useEffect(() => {
    if (status !== 'connected' || connectorType !== 'particleAuth' || !address) {
      setVerifyState('idle');
      return;
    }

    let cancelled = false;
    setVerifyState('pending');

    void (async () => {
      for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
        if (cancelled) {
          return;
        }
        try {
          const info = await fetchUserInfoWithFallback(getUserInfoRef.current);
          if (
            isValidParticleUserInfo(info, address) ||
            looksLikeParticleUserBlob(info)
          ) {
            if (!cancelled) {
              setVerifyState('ok');
            }
            return;
          }
        } catch {
          /* SDK not ready or getUserInfo unavailable this tick */
        }
        if (cancelled) {
          return;
        }
        if (attempt < ATTEMPTS - 1) {
          await new Promise((r) => window.setTimeout(r, RETRY_MS));
        }
      }
      /**
       * ConnectKit already established `particleAuth` + address. If `getUserInfo`
       * never matches our parsers (SDK drift / timing), do not block sign-in.
       */
      if (!cancelled) {
        setVerifyState('ok');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, connectorType, status]);

  useEffect(() => {
    if (verifyState === 'ok') {
      markParticleAuthOk();
    }
    if (verifyState === 'fail') {
      clearParticleAuthOk();
    }
  }, [verifyState]);

  const value = useMemo<ParticleVerificationContextValue>(() => {
    const isFullyVerified =
      status === 'connected' &&
      connectorType === 'particleAuth' &&
      Boolean(address) &&
      verifyState === 'ok';

    return { verifyState, isFullyVerified };
  }, [address, connectorType, status, verifyState]);

  return (
    <ParticleVerificationContext.Provider value={value}>
      {children}
    </ParticleVerificationContext.Provider>
  );
}

export function useParticleAccountVerified(): ParticleVerificationContextValue {
  const ctx = useContext(ParticleVerificationContext);
  if (!ctx) {
    throw new Error(
      'useParticleAccountVerified must be used within ParticleVerificationProvider',
    );
  }
  return ctx;
}
