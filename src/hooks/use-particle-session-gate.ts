'use client';

import { useAccount } from '@particle-network/connectkit';
import { useEffect, useRef, useState } from 'react';

const HYDRATION_GRACE_MS = 800;
/** Never block the UI forever if connection state flaps during reconnect. */
const HYDRATION_FAILSAFE_MS = 12_000;

/**
 * Avoid treating a brief initial `disconnected` (before ConnectKit reconnect runs) as
 * “logged out”. Also skip the grace delay after explicit disconnect from `connected`.
 */
export function useParticleSessionGate(): {
  /** True while disconnected but we are still waiting on reconnect / first paint. */
  waitingForReconnectOrHydration: boolean;
} {
  const account = useAccount();
  const status = account.status;
  const skipDisconnectedGrace = useRef(false);

  useEffect(() => {
    if (status === 'reconnecting') {
      skipDisconnectedGrace.current = true;
    }
  }, [status]);

  const prevStatusRef = useRef<typeof status | undefined>(undefined);
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (
      prev === 'connected' &&
      (status === 'disconnected' || status === 'connecting')
    ) {
      skipDisconnectedGrace.current = true;
    }
    prevStatusRef.current = status;
  }, [status]);

  const [allowDisconnectedUi, setAllowDisconnectedUi] = useState(false);

  useEffect(() => {
    if (
      status === 'connecting' ||
      status === 'reconnecting' ||
      status === 'connected'
    ) {
      setAllowDisconnectedUi(false);
      return;
    }

    if (skipDisconnectedGrace.current) {
      setAllowDisconnectedUi(true);
      return;
    }

    const id = window.setTimeout(
      () => setAllowDisconnectedUi(true),
      HYDRATION_GRACE_MS
    );
    return () => window.clearTimeout(id);
  }, [status]);

  useEffect(() => {
    if (status !== 'disconnected' || allowDisconnectedUi) {
      return;
    }
    const id = window.setTimeout(
      () => setAllowDisconnectedUi(true),
      HYDRATION_FAILSAFE_MS
    );
    return () => window.clearTimeout(id);
  }, [status, allowDisconnectedUi]);

  const waitingForReconnectOrHydration =
    status === 'disconnected' && !allowDisconnectedUi;

  return { waitingForReconnectOrHydration };
}
