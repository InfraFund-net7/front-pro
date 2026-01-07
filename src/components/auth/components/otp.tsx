import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { connect } from '@particle-network/auth-core';
// import { useConnect } from '@particle-network/connectkit';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useState } from 'react';

interface OtpProps {
  email: string;
}

const Otp = ({ email }: OtpProps) => {
  const [otpValue, setOtpValue] = useState<string>('');

  const handleOtp = async (value: string) => {
    console.log(otpValue);

    if (otpValue.length < 6) {
      setOtpValue(value);
    } else {
      try {
        console.log('ok');
        const userInfo = await connect({ email, code: otpValue });
        console.log(userInfo);
      } catch {
        setOtpValue('');
      }
    }
  };
  return (
    <div className="self-center">
      <InputOTP
        maxLength={6}
        value={otpValue}
        pattern={REGEXP_ONLY_DIGITS}
        onChange={(e) => handleOtp(e)}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
};

export default Otp;
