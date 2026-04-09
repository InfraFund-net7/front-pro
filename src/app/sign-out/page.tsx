'use client';

import { clearParticleAuthOk } from '@/lib/particle-session-memory';
import { useDisconnect, useModal } from '@particle-network/connectkit';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';

export default function SignOutPage() {
  const router = useRouter();
  const { disconnectAsync } = useDisconnect();
  const { setOpen } = useModal();
  const [busy, setBusy] = useState(false);

  const handleSignOut = useCallback(async () => {
    setBusy(true);
    try {
      clearParticleAuthOk();
      setOpen(false);
      /**
       * Disconnect can leave ConnectKit in `reconnecting` for a long time; the
       * dashboard guard then shows “Checking your Particle session…” forever.
       * Race with a cap, then hard-navigate so the guarded layout unmounts.
       */
      await Promise.race([
        disconnectAsync(),
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, 8_000);
        }),
      ]);
    } catch {
      /* Still leave the app shell — soft disconnect errors are non-fatal here. */
    }
    window.location.assign('/login');
  }, [disconnectAsync, setOpen]);

  return (
    <div className="max-w-lg chakra-petch text-white space-y-8 py-2">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold ibm-plex-mono tracking-tight">
          Sign out
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          Disconnect your Particle wallet from InfraFund. You will need to sign
          in again to open the dashboard.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#141820]/80 p-5 space-y-3">
        <p className="text-gray-300 text-sm">
          This clears your wallet connection in this browser. Your on-chain
          assets are not affected.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSignOut()}
          className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none text-white font-medium text-sm"
        >
          {busy ? 'Signing out…' : 'Sign out'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => router.back()}
          className="px-6 py-3 rounded-lg border border-white/20 text-gray-300 hover:bg-white/5 font-medium text-sm"
        >
          Cancel
        </button>
      </div>

    </div>
  );
}
