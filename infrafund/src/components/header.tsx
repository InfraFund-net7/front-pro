import { Bell, Headset, Wallet } from "lucide-react";
import React from "react";
import { CustomButton } from "./ui/custom-button";

export default function Header() {
  return (
    <div className="flex h-16 shrink-0 justify-between items-end  sticky top-0 z-20 rounded-lg mb-4 ">
      <div className="flex flex-col gap-2\">
        <span className="text-sm font-normal text-white">Hi sherv</span>
        <span className="text-[40px] font-bold text-white">KYC</span>
      </div>
      <div className="flex justify-center items-center gap-4">
        <Headset size={24} className="text-white cursor-pointer" />
        <Bell size={24} className="text-white cursor-pointer" />
        <CustomButton
          variant="outlined"
          className="w-fit h-[40px] flex justify-center items-center gap-2 text-primary"
        >
          <Wallet size={24} />
          <span className="text-sm font-semibold">Connect Wallet</span>
        </CustomButton>
        <div className="w-12 h-12 rounded-full bg-[#263247] flex justify-center items-center">
          S
        </div>
      </div>
    </div>
  );
}
