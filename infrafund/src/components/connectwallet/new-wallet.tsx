import React from "react";
import CardView from "../ui/card-view";
import { FormInput } from "../ui/form-input";
import { CustomButton } from "../ui/custom-button";

export default function NewWallet() {
  return (
    <CardView width="583px" height="763px" padding="p-12">
      <span className="text-10 font-semibold text-white">
        Set Up Your Wallet
      </span>
      <div className="flex flex-col justify-center items-start gap-6">
        <div className="flex flex-col justify-center items-end gap-4">
          <div className="flex flex-col justify-center items-end gap-3">
            <span className="text-sm font-medium text-white">
              Create Password
            </span>
            <FormInput
              label="Enter your password"
              placeholder="Enter your password"
            />
          </div>
          <div className="flex flex-col gap-2  justify-center items-end">
            <span className="text-gray-300 text-[10px] font-normal">
              -Minimum length should be at least 8
            </span>
            <span className="text-gray-300 text-[10px] font-normal">
              -Minimum length should be at least 8
            </span>
            <span className="text-gray-300 text-[10px] font-normal">
              -Minimum length should be at least 8
            </span>
            <span className="text-gray-300 text-[10px] font-normal">
              -Minimum length should be at least 8
            </span>
          </div>
        </div>
        <FormInput label="Confirm Password" placeholder="Confirm Password" />
        <div className="flex justify-center items-center gap-4">
          <div className="w-4 h-4" />
          <span className=" text-sm text-gray-50 font-normal">
            I agree to Terms of Service and Privacy Notice.
          </span>
        </div>
        <div className="w-full h-fit justify-center items-center gap-6">
          <CustomButton variant="filled">
            <span className="text-lg text-black font-semibold">
              Generate Wallet
            </span>
          </CustomButton>
          <CustomButton variant="canceled">
            <span className="text-lg text-primary font-semibold">
              Generate Wallet
            </span>
          </CustomButton>
        </div>
      </div>
    </CardView>
  );
}
