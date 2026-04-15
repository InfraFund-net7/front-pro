'use client';

import { clearParticleAuthOk } from '@/lib/particle-session-memory';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  useAccount,
  useDisconnect,
  useModal,
  useParticleAuth,
} from '@particle-network/connectkit';
import type { ParticleVerifyState } from '@/hooks/use-particle-account-verified';

function ParticleLoginContent({
  verifyState,
}: {
  verifyState: ParticleVerifyState;
}) {
  const account = useAccount();
  const { disconnect, disconnectAsync } = useDisconnect();
  const { needRestoreWallet } = useParticleAuth();
  const { setOpen } = useModal();
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;

  const status = account.status;
  const address = account.status === 'connected' ? account.address : undefined;
  const connectorType =
    account.status === 'connected'
      ? account.connector.walletConnectorType
      : undefined;

  const isConnected = status === 'connected';
  const isParticleWallet =
    isConnected && connectorType === 'particleAuth' && Boolean(address);
  const isOtherWallet =
    isConnected && connectorType !== undefined && !isParticleWallet;

  // Auto-open the Particle modal as soon as the login page loads
  useEffect(() => {
    if (!isConnected) {
      const timer = window.setTimeout(() => setOpenRef.current(true), 300);
      return () => window.clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignInWithParticle = useCallback(async () => {
    if (isConnected) {
      clearParticleAuthOk();
      await disconnectAsync();
      window.setTimeout(() => setOpenRef.current(true), 500);
      return;
    }
    setOpenRef.current(true);
  }, [disconnectAsync, isConnected]);

  const handleDisconnect = useCallback(() => {
    clearParticleAuthOk();
    disconnect();
  }, [disconnect]);

  return (
    <div className="relative text-center space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Sign in to InfraFund
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          Authentication is handled by{' '}
          <span className="text-gray-200 font-medium">Particle</span> — use the{' '}
          <span className="text-gray-200">Log in or sign up</span> window (email
          or social). InfraFund then opens your dashboard after Particle
          confirms your account.
        </p>
      </div>

      {!isConnected ? (
        <div className="bg-[#1a2332] border border-white/10 rounded-lg p-4 text-left space-y-3">
          <p className="text-gray-300 text-sm">
            Use the button below to open Particle’s log-in or sign-up window
            (email or social).
          </p>
          <p className="text-gray-500 text-xs">
            If you were signed in recently, your session is restored
            automatically when possible — this screen only appears when there is
            no active wallet session.
          </p>
        </div>
      ) : isOtherWallet ? (
        <div className="bg-amber-950/40 border border-amber-600/50 rounded-lg p-4 text-left space-y-2">
          <p className="text-amber-200 text-sm font-medium">
            Wrong wallet type for this app
          </p>
          <p className="text-gray-400 text-xs">
            Disconnect, then sign in with Particle only (email or social).
          </p>
        </div>
      ) : isParticleWallet && verifyState === 'fail' ? (
        <div className="bg-red-950/40 border border-red-600/50 rounded-lg p-4 text-left space-y-2">
          <p className="text-red-300 text-sm font-medium">
            Particle could not verify your session
          </p>
          <p className="text-gray-400 text-xs">
            Try signing in again below. If it keeps failing, disconnect and
            start over.
          </p>
          {needRestoreWallet() ? (
            <p className="text-amber-200/90 text-xs pt-1">
              Particle may need you to finish wallet restore (e.g. master
              password). Complete that in the Particle flow, or disconnect and
              sign in again.
            </p>
          ) : null}
          {address ? (
            <p className="text-gray-500 text-xs font-mono break-all pt-1">
              {address}
            </p>
          ) : null}
        </div>
      ) : isParticleWallet && verifyState === 'idle' ? (
        <div className="bg-[#1a2332] border border-white/10 rounded-lg p-4">
          <p className="text-gray-300 text-sm">
            Preparing Particle verification…
          </p>
        </div>
      ) : isConnected ? (
        <div className="bg-[#1a2332] border border-white/10 rounded-lg p-4 text-left">
          <p className="text-gray-300 text-sm">
            You already have a wallet session. To see the Particle{' '}
            <strong className="text-gray-200">Log in or sign up</strong> screen
            again (e.g. another account), use the button below — we’ll
            disconnect first, then open it.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => void handleSignInWithParticle()}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
        >
          Sign in with Particle
        </button>
        {isConnected ? (
          <button
            type="button"
            onClick={handleDisconnect}
            className="w-full py-3 border border-white/20 text-gray-300 hover:bg-white/5 rounded-lg font-medium text-sm"
          >
            Disconnect wallet
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function ParticleLogin({
  verifyState,
}: {
  verifyState: ParticleVerifyState;
}) {
  return <ParticleLoginContent verifyState={verifyState} />;
}
