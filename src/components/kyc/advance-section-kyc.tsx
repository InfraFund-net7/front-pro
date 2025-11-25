import React, { useState } from "react";
import CardView from "../ui/card-view";
import { NationalitySelect } from "../ui/nationality-select";
import { SelectTypeButton } from "../ui/select-mode-btn";
import { BookUser, Gem, IdCard } from "lucide-react";
import { CustomButton } from "../ui/custom-button";
import BoxUpload from "../ui/box-upload";
import Image from "next/image";
import finish from "@/../public/assets/svg/advance-section-finish.svg";

const portatialdata = [
  { name: "Don’t use beauty photos" },
  { name: "Don’t make up" },
  { name: "Don’t wear hats" },
  { name: "Don’t take screenshots" },
];

const UploadPortartial = () => (
  <div className="flex flex-col gap-10">
    <div className="flex flex-col gap-6">
      <span className="text-sm text-gray-500 font-semibold">
        Upload portrait photo
      </span>
      <span className="text-base font-semibold text-gray-50">
        Important Notes
      </span>
    </div>
    <div className="grid grid-cols-2 gap-6 w-full justify-end items-start h-fit">
      {portatialdata.map((item, index) => (
        <div
          key={index}
          className="flex justify-center items-end gap-2 w-fit h-[18px] text-left"
        >
          <Gem size={16} className="text-primary" />
          <span className="text-sm text-gray-300 font-medium">{item.name}</span>
        </div>
      ))}
    </div>
    <span className="text-sm font-normal text-white">
      Please ensure that your face is centered, well lit, and visible when
      capturing the photo to avoid facial recognition errors.
    </span>
    <BoxUpload text="Upload portrait photo" width={487} height={140} />
  </div>
);

const Upload = () => (
  <div className="flex flex-col gap-4 w-full justify-center items-start">
    <div className=" w-full h-fit flex justify-between items-center ">
      <BoxUpload text="Upload front page" width={236} height={140} />
      <BoxUpload text="Upload back page" width={236} height={140} />
    </div>
    <span className="text-xs text-[#8F97B0] font-normal">
      Upload .jpeg/.jpg/.png file and no more than 5 Mb.
    </span>
  </div>
);

const Finish = () => (
  <div className="flex flex-col gap-10 items-center justify-center h-full">
    <Image src={finish} alt="Finish Icon" width={211} height={146} />
    <span className="text-[31px] text-gray-50 font-normal">
      Upgrade Under Review
    </span>
    <span className="text-[18px] font-medium text-gray-500">
      Review expected to be completed:
    </span>
    <span className="text-[18px] font-medium text-primary">2025-06-19</span>
  </div>
);

const steps = [
  {
    title: "Advance Verification",
    content: (
      <>
        <NationalitySelect label="Document Issuing Country" />
        <div className="flex flex-col gap-6 w-full items-start">
          <span className="text-gray-500 text-[14px] font-semibold">
            Document type
          </span>
          <SelectTypeButton
            icon={<IdCard />}
            onClick={() => console.log("Button clicked!")}
          >
            <span className="text-gray-50 text-[14px] font-medium">
              ID Card
            </span>
          </SelectTypeButton>
          <SelectTypeButton icon={<BookUser />}>
            <span className="text-gray-50 text-[14px] font-medium">
              Passport
            </span>
          </SelectTypeButton>
        </div>
      </>
    ),
    nextButton: "Begin Verification",
  },
  {
    title: "Upload Documents",
    content: <Upload />,
    nextButton: "Continue",
  },
  {
    title: "Upload Portrait Photo",
    content: <UploadPortartial />,
    nextButton: "Continue",
  },
  {
    title: "Finish",
    content: <Finish />,
    nextButton: "Done",
  },
];

export default function AdvanceSection() {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(0);
    }
  };

  const handleCancel = () => {
    setCurrentStep(0);
  };

  const { content, nextButton } = steps[currentStep];

  return (
    <CardView
      width="w-[584px]"
      height="h-[763px]"
      padding="p-8"
      className="flex flex-col"
      font="ibm-plex-mono"
    >
      <span className="text-[40px] text-white font-semibold">
        Advance Verification
      </span>
      {content}
      <div className="flex justify-center items-center gap-6 w-full">
        {currentStep < steps.length - 1 && (
          <CustomButton
            variant="canceled"
            className="w-[200px] h-[47px] flex justify-center items-center"
            onClick={handleCancel}
          >
            Cancel
          </CustomButton>
        )}
        <CustomButton
          variant="filled"
          className="w-fit h-[47px] flex justify-center items-center"
          onClick={handleNext}
        >
          {nextButton}
        </CustomButton>
      </div>
    </CardView>
  );
}
