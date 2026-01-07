'use client';
import infrafund from '@/../public/assets/svg/infrafund.svg';
import Or from '@/../public/assets/svg/or-section.svg';
import { LoginState } from '@/types/login';
import { isEmailValid } from '@/utils/isEmailValid';
import { useConnect, useConnectors } from '@particle-network/connectkit';
import { QrCode } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import google from '../../../public/assets/svg/google.svg';
import CardView from '../ui/card-view';
import LoginForm from './components/loginForm';
import Otp from './components/otp';
export default function Login() {
  const [formState, setFormState] = useState<LoginState>('send-email');
  const [email, setEmail] = useState<string>('');
  const [isLogin, setIsLogin] = useState(true);

  const connectors = useConnectors();
  const { connect, status } = useConnect();

  const toggleForm = () => setIsLogin(!isLogin);
  const googleLogin = () => {
    const particleConnector = connectors.find(
      (c) => c.id === 'particleAuth' || c.walletConnectorType === 'particleAuth'
    );
    if (!particleConnector) return;

    connect({
      connector: particleConnector,
      authParams: { socialType: 'google' },
    });
  };

  const walletConnectHandler = () => {
    const particleConnector = connectors[0];
    if (!particleConnector) return;
    try {
      connect({
        connector: particleConnector,
      });
    } catch {
      // error handling
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full gap-4 h-fit">
      <CardView width="547px" height="728px" padding="p-12" className="gap-4">
        {/* Logo */}
        <Image src={infrafund} width={172} height={42} alt="InfraFund" />
        {/* Title */}
        <span className="text-[40px] font-semibold">
          {isLogin ? 'Login' : 'Welcome to InfraFund'}
        </span>
        {/* Email */}
        {formState === 'send-email' && (
          <LoginForm
            setFormState={setFormState}
            email={email}
            isLogin={isLogin}
            setEmail={setEmail}
          />
        )}
        {formState === 'otp' && isEmailValid(email) && <Otp email={email} />}
        {/* Or */}
        <Image src={Or} width={451} height={23} alt="or" />
        {/* Social Buttons */}
        <div className="flex flex-col gap-3 mt-4 w-full">
          <button
            className="flex relative items-center justify-center gap-4 rounded-lg border border-v0-button-border px-6 py-3 text-white font-mono text-lg transition-colors hover:bg-primary"
            onClick={googleLogin}
          >
            <Image
              src={google}
              width={24}
              height={24}
              alt="google"
              className="absolute left-4"
            />
            <span className="text-lg font-semibold text-[#C7CAD5]">
              Continue with Google
            </span>
          </button>
          <button
            className="flex relative items-center justify-center gap-4 rounded-lg border border-v0-button-border px-6 py-3 text-white font-mono text-lg transition-colors hover:bg-primary"
            onClick={walletConnectHandler}
          >
            <QrCode size={24} className="absolute left-4" />
            <span className="text-lg font-semibold text-[#C7CAD5]">
              Connect with Wallet
            </span>
          </button>
        </div>
      </CardView>

      {/* Switch between Login and Signup */}
      <span className="text-sm text-gray-50 mt-2">
        {isLogin ? 'Don’t have an account?' : 'Already have an account?'}{' '}
        <button
          onClick={toggleForm}
          className="text-primary cursor-pointer font-semibold hover:underline"
        >
          {isLogin ? 'Sign Up' : 'Login'}
        </button>
      </span>
    </div>
  );
}
