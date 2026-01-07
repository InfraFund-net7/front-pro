import { CustomButton } from '@/components/ui/custom-button';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';
import { FormInput } from '@/components/ui/form-input';
import { LoginState } from '@/types/login';
import { getConnectCaptcha } from '@particle-network/auth-core';
import { Dispatch, SetStateAction, useState } from 'react';

interface PropsLoginForm {
  email: string;
  isLogin: boolean;
  setEmail: Dispatch<SetStateAction<string>>;
  setFormState: Dispatch<SetStateAction<LoginState>>;
}

const LoginForm = ({
  email,
  setEmail,
  isLogin,
  setFormState,
}: PropsLoginForm) => {
  const [isChecked, setIsChecked] = useState(false);
  const sendEmailHandler = async () => {
    if (!email) return;
    await getConnectCaptcha({ email });
    setFormState('otp');
  };
  const handleToggleCheckbox = () => setIsChecked(!isChecked);

  return (
    <>
      <div className="w-full h-fit">
        <FormInput
          label="Email"
          placeholder="example@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {/* Checkbox only for signup */}
      {!isLogin && (
        <div className="flex items-center gap-4 mt-4">
          <CustomCheckbox checked={isChecked} onToggle={handleToggleCheckbox} />
          <span className="text-gray-50 text-sm">
            By creating an account, I agree to <br />
            infrafund&apos;s Terms of Service and Privacy Notice.
          </span>
        </div>
      )}

      {/* Continue Button */}
      <CustomButton
        variant="filled"
        onClick={sendEmailHandler}
        className="w-full h-[47px] flex justify-center items-center"
      >
        <span className="text-lg font-semibold text-black">
          {isLogin ? 'Send Email' : 'Continue'}
        </span>
      </CustomButton>
    </>
  );
};

export default LoginForm;
