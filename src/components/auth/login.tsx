"use client";
import React, { useState } from "react";
import CardView from "../ui/card-view";
import Image from "next/image";
import infrafund from "@/../public/assets/svg/infrafund.svg";
import Or from "@/../public/assets/svg/or-section.svg";
import { FormInput } from "../ui/form-input";
import { CustomCheckbox } from "../ui/custom-checkbox";
import { CustomButton } from "../ui/custom-button";
import { QrCode } from "lucide-react";
import google from "@/../public/assets/svg/google.svg";
export default function Login() {
  const [isChecked, setIsChecked] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => setIsLogin(!isLogin);
  const handleToggleCheckbox = () => setIsChecked(!isChecked);

  return (
    <div className="flex flex-col items-center justify-center w-full gap-4 h-fit">
      <CardView width="547px" height="728px" padding="p-12" className="gap-4">
        {/* Logo */}
        <Image src={infrafund} width={172} height={42} alt="InfraFund" />

        {/* Title */}
        <span className="text-[40px] font-semibold">
          {isLogin ? "Login" : "Welcome to InfraFund"}
        </span>

        {/* Email */}
        <div className="w-full h-fit">
          <FormInput label="Email" placeholder="Email" />
        </div>
        {/* Checkbox only for signup */}
        {!isLogin && (
          <div className="flex items-center gap-4 mt-4">
            <CustomCheckbox
              checked={isChecked}
              onToggle={handleToggleCheckbox}
            />
            <span className="text-gray-50 text-sm">
              By creating an account, I agree to <br />
              infrafund&apos;s Terms of Service and Privacy Notice.
            </span>
          </div>
        )}

        {/* Continue Button */}
        <CustomButton
          variant="filled"
          className="w-full h-[47px] flex justify-center items-center"
        >
          <span className="text-lg font-semibold text-black">
            {isLogin ? "Login" : "Continue"}
          </span>
        </CustomButton>

        {/* Or */}
        <Image src={Or} width={451} height={23} alt="or" />

        {/* Social Buttons */}
        <div className="flex flex-col gap-3 mt-4 w-full">
          <button className="flex relative items-center justify-center gap-4 rounded-lg border border-v0-button-border px-6 py-3 text-white font-mono text-lg transition-colors hover:bg-primary">
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
          <button className="flex relative items-center justify-center gap-4 rounded-lg border border-v0-button-border px-6 py-3 text-white font-mono text-lg transition-colors hover:bg-primary">
            <QrCode size={24} className="absolute left-4" />
            <span className="text-lg font-semibold text-[#C7CAD5]">
              Connect with Wallet
            </span>
          </button>
        </div>
      </CardView>

      {/* Switch between Login and Signup */}
      <span className="text-sm text-gray-50 mt-2">
        {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
        <button
          onClick={toggleForm}
          className="text-primary cursor-pointer font-semibold hover:underline"
        >
          {isLogin ? "Sign Up" : "Login"}
        </button>
      </span>
    </div>
  );
}
