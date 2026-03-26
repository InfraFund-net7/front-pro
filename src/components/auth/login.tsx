'use client';

import React, { useEffect, useState } from 'react';
import {
  useUser,
  useOAuth,
  useEmailOtpAuth,
  useSignOut,
  OAuthProvider,
} from '@openfort/react';
import { useRouter } from 'next/navigation';
import CardView from '../ui/card-view';
import infrafund from '@/../public/assets/svg/infrafund.svg';
import Image from 'next/image';
import { CustomButton } from '../ui/custom-button';

export default function Login() {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const { initOAuth, isLoading: oauthLoading } = useOAuth();
  const {
    requestEmailOtp,
    signInEmailOtp,
    isLoading: otpLoading,
  } = useEmailOtpAuth();
  const { signOut } = useSignOut();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/home');
    }
  }, [isAuthenticated, user, router]);

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await initOAuth({ provider: OAuthProvider.GOOGLE });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google login failed');
    }
  };

  const handleSendOtp = async () => {
    setError('');
    if (!email) {
      setError('Please enter your email');
      return;
    }
    try {
      await requestEmailOtp({ email });
      setOtpSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    try {
      await signInEmailOtp({ email, otp });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="w-full flex justify-center items-center">
        <CardView
          width="547px"
          height="500px"
          className="p-6 text-white flex flex-col justify-center items-center md:p-8"
        >
          <p className="text-gray-400">Redirecting to dashboard...</p>
          <button
            onClick={() => signOut()}
            className="mt-4 text-sm text-red-400 hover:text-red-300"
          >
            Sign out instead
          </button>
        </CardView>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center">
      <CardView
        width="547px"
        className="p-6 text-white flex flex-col justify-center items-center md:p-8 gap-6"
      >
        <div className="w-full flex justify-center items-center py-4">
          <Image src={infrafund} alt="InfraFund" />
        </div>

        <div className="w-full max-w-sm space-y-4">
          {/* Google Login */}
          <CustomButton
            variant="filled"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleLogin}
            disabled={oauthLoading}
          >
            <span className="text-sm font-semibold text-black">
              {oauthLoading ? 'Connecting...' : 'Continue with Google'}
            </span>
          </CustomButton>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          {/* Email OTP Login */}
          {!otpSent ? (
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg bg-[#131C2F] border border-gray-700 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
              />
              <CustomButton
                variant="filled"
                className="w-full"
                onClick={handleSendOtp}
                disabled={otpLoading}
              >
                <span className="text-sm font-semibold text-black">
                  {otpLoading ? 'Sending...' : 'Send verification code'}
                </span>
              </CustomButton>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 text-center">
                Code sent to <span className="text-white">{email}</span>
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg bg-[#131C2F] border border-gray-700 text-white text-center text-lg tracking-widest placeholder-gray-500 focus:border-primary focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
              />
              <CustomButton
                variant="filled"
                className="w-full"
                onClick={handleVerifyOtp}
                disabled={otpLoading}
              >
                <span className="text-sm font-semibold text-black">
                  {otpLoading ? 'Verifying...' : 'Verify & Sign In'}
                </span>
              </CustomButton>
              <button
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                }}
                className="w-full text-sm text-gray-500 hover:text-gray-300"
              >
                Use a different email
              </button>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 text-center mt-2">{error}</p>
          )}
        </div>
      </CardView>
    </div>
  );
}
