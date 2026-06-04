'use client';

import { useSignOut } from '@openfort/react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';

const USER_ROLE_STORAGE_KEY = 'infrafund_user_role';
const USER_ROLE_UPDATED_EVENT = 'infrafund:user-role-updated';

export default function SignOutPage() {
  const router = useRouter();
  const { signOut } = useSignOut();
  const [busy, setBusy] = useState(false);

  const handleSignOut = useCallback(async () => {
    setBusy(true);
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem(USER_ROLE_STORAGE_KEY);
      window.dispatchEvent(new Event(USER_ROLE_UPDATED_EVENT));
      await signOut();
    } catch {
      /* non-fatal */
    }
    window.location.assign('/login');
  }, [signOut]);

  return (
    <div className="max-w-lg chakra-petch space-y-8 py-2 text-white">
      <div className="space-y-2">
        <h1 className="ibm-plex-mono text-2xl font-bold tracking-tight">
          Sign out
        </h1>
        <p className="text-sm leading-relaxed text-gray-400">
          End your InfraFund dashboard session and OpenFort session in this
          browser.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSignOut()}
          className="rounded-lg bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50"
        >
          {busy ? 'Signing out…' : 'Sign out'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => router.back()}
          className="rounded-lg border border-white/20 px-6 py-3 text-sm font-medium text-gray-300 hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
