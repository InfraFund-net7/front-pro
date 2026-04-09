'use client';

import React, { useEffect, useState, Suspense, useRef } from 'react';
import {
  useAccount,
  useDisconnect,
  useModal,
  useParticleAuth,
  useWallets,
} from '@particle-network/connectkit';

interface UserInfo {
  uuid: string;
  token?: string;
  [key: string]: unknown;
}

function ParticleViewerContent() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { setOpen } = useModal();
  const { getUserInfo } = useParticleAuth();
  const [primaryWallet] = useWallets();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;

  const getUserInfoRef = useRef(getUserInfo);
  getUserInfoRef.current = getUserInfo;

  const walletConnectorType = primaryWallet?.connector?.walletConnectorType;

  useEffect(() => {
    if (!isConnected) {
      const timer = setTimeout(() => setOpenRef.current(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected || walletConnectorType !== 'particleAuth') {
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const info = await getUserInfoRef.current();
        if (!cancelled) {
          setUserInfo(info as unknown as UserInfo);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isConnected, walletConnectorType]);

  const handleDisconnect = () => {
    disconnect();
    setUserInfo(null);
  };

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-white mb-4">
        Particle Social Login Tester
      </h1>

      {isConnected && address ? (
        <div className="bg-green-900/30 border border-green-500 rounded-lg p-4 mb-6">
          <p className="text-green-400 font-medium">Connected (Social Login)</p>
          <p className="text-gray-300 text-sm mt-1 font-mono break-all">
            {address}
          </p>
        </div>
      ) : (
        <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4 mb-6">
          <p className="text-yellow-400">Not Connected</p>
        </div>
      )}

      {loading && (
        <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 mb-4">
          <p className="text-blue-400">Loading user info...</p>
        </div>
      )}

      {/* Display UUID and User Info */}
      {userInfo && (
        <div className="bg-cyan-900/20 border border-cyan-500 rounded-lg p-5 mb-6 text-left">
          <p className="text-cyan-400 font-bold text-lg mb-3 text-center">
            User Info
          </p>

          {/* UUID */}
          <div className="mb-4 bg-gray-900/50 p-4 rounded border border-cyan-600">
            <span className="text-gray-400 block mb-2">UUID:</span>
            <span className="text-white font-mono break-all text-lg">
              {userInfo.uuid}
            </span>
          </div>

          {/* Token */}
          <div className="mb-4 bg-gray-900/50 p-4 rounded border border-cyan-600">
            <span className="text-gray-400 block mb-2">Token:</span>
            <span className="text-white font-mono break-all text-xs">
              {userInfo.token?.slice(0, 50)}...
            </span>
          </div>

          {/* Full User Info */}
          <pre className="text-white text-xs break-all whitespace-pre-wrap max-h-96 overflow-y-auto bg-gray-900/50 p-4 rounded">
            {JSON.stringify(userInfo, null, 2)}
          </pre>
        </div>
      )}

      <div className="flex gap-3 mt-8">
        {isConnected ? (
          <button
            onClick={handleDisconnect}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Login with Email / Social
          </button>
        )}
      </div>
    </div>
  );
}

export default function ParticleViewer() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center text-white bg-gray-900">
          Loading...
        </div>
      }
    >
      <ParticleViewerContent />
    </Suspense>
  );
}
