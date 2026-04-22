'use client';
import React, { useState } from 'react';
import CardView from '../ui/card-view';
import { FormInput } from '../ui/form-input';
import { NationalitySelect } from '../ui/nationality-select';
import { StepIndicator } from '../ui/step-indicator';
import { CustomButton } from '../ui/custom-button';
import bigtik from '@public/assets/svg/big-tik.svg';
import Image from 'next/image';

type BasicSectionProps = {
  onComplete?: () => void;
  onUpgrade?: () => void;
};

export default function BasicSection({
  onComplete,
  onUpgrade,
}: BasicSectionProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isFinished, setIsFinished] = useState(false);

  const steps = ['Step 1', 'Step 2'];
  const stepSubtitles = ['Basic Verification', 'Additional Information'];

  function renderStepContent(step: number) {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col gap-8">
            <NationalitySelect label="Nationality" />
            <div className="grid grid-cols-2 justify-center items-center gap-4">
              <FormInput placeholder="First Name" label="First Name" />
              <FormInput placeholder="Last Name" label="Last Name" />
              <FormInput placeholder="Middle Name" label="Middle Name" />
              <FormInput placeholder="Date Of Birth" label="Date Of Birth" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <FormInput placeholder="Street Address" label="Street Address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput placeholder="Postal Code" label="Postal Code" />
              <FormInput placeholder="City" label="City" />
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <CardView
      width="w-[584px]"
      height="h-[763px]"
      padding="p-8"
      font="ibm-plex-mono"
    >
      {isFinished ? (
        <div className="flex flex-col justify-between items-center w-full h-full">
          <div className="flex flex-col justify-center items-center gap-8">
            <Image src={bigtik} width={102} height={102} alt="Basic-Verified" />
            <span className="text-[31px] font-normal text-white">
              Account Verified!
            </span>
          </div>
          <div className="flex flex-col gap-6 w-full">
            <CustomButton
              variant="filled"
              onClick={() => {
                setIsFinished(false);
                onComplete?.();
              }}
            >
              Ok
            </CustomButton>
            <CustomButton
              variant="outlined"
              onClick={() => {
                setIsFinished(false);
                onUpgrade?.();
              }}
            >
              Upgrade to Advance
            </CustomButton>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 justify-center items-start">
            <span className="text-[40px] text-white font-semibold">
              Basic Verification
            </span>
            <span className="text-gray-500 text-[14px] font-semibold">
              {stepSubtitles[currentStep - 1]}
            </span>
          </div>

          <div className="my-6 w-full">{renderStepContent(currentStep)}</div>

          <div className="flex justify-center items-center w-full mt-4">
            <StepIndicator steps={steps} currentStep={currentStep} />
          </div>

          <CustomButton
            className="w-full mt-6"
            onClick={() => {
              if (currentStep < steps.length) {
                setCurrentStep(currentStep + 1);
              } else {
                setIsFinished(true);
              }
            }}
          >
            Continue
          </CustomButton>
        </>
      )}
    </CardView>
  );
}
