"use client";
import React, { useState } from "react";
import CardView from "../ui/card-view";
import {
  Check,
  SquarePen,
  X,
  Grid2X2Check,
  IdCard,
  ScanFace,
  MapPinHouse,
  History,
} from "lucide-react";
import { CustomButton } from "../ui/custom-button";
import BasicSection from "./basic-section-kyc";
import AdvanceSection from "./advance-section-kyc";

const features = [
  { label: "Create Project", basic: false, advanced: true },
  { label: "Tokenization", basic: false, advanced: true },
  { label: "Investment Portal", basic: false, advanced: true },
  { label: "Digital Asset Offering", basic: false, advanced: true },
  { label: "Investor's Management", basic: false, advanced: true },
  { label: "Investment Requests", basic: false, advanced: true },
  { label: "Asset Management", basic: true, advanced: true },
  { label: "Swap", basic: true, advanced: true },
];

const basicDetails = [
  { text: "Personal Information", icon: SquarePen },
  { text: "Review time: 1 day", icon: History },
];

const advancedDetails = [
  { text: "All basic requirement", icon: Grid2X2Check },
  { text: "Government ID", icon: IdCard },
  { text: "Facial verification", icon: ScanFace },
  { text: "Proof of address", icon: MapPinHouse },
  { text: "Review time: 10 days", icon: History },
];

type DetailItem = {
  text: string;
  icon: React.ElementType;
};

type KycCardProps = {
  title: string;
  details: DetailItem[];
  accessLevel: "basic" | "advanced";
  buttonClassName?: string;
  onButtonClick?: () => void;
  isVerified?: boolean;
};

const KycCard: React.FC<KycCardProps> = ({
  title,
  details,
  accessLevel,
  onButtonClick,
  buttonClassName,
  isVerified = false,
}) => {
  return (
    <CardView
      width="w-[484px]"
      height="h-[728px]"
      padding="p-8"
      font="ibm-plex-mono"
    >
      <h2
        style={{ fontFamily: '"Chakra Petch", sans-serif' }}
        className="font-semibold text-2xl text-white"
      >
        {title}
      </h2>

      <div className="flex flex-col gap-2 h-[154px] my-4">
        {details.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="text-gray-500 flex gap-2.5">
              <Icon size={16} />
              <span className="text-sm font-medium ibm-plex-mono">
                {item.text}
              </span>
            </div>
          );
        })}
      </div>
      {accessLevel === "advanced" ? (
        isVerified ? (
          <CustomButton
            variant="filled"
            type="submit"
            onClick={onButtonClick}
            className={`w-full text-xl font-semibold ${buttonClassName || ""}`}
          >
            Verify Now
          </CustomButton>
        ) : (
          <button className="bg-gray-300 flex justify-center items-center px-8 py-4 w-full rounded-lg text-gray-600 text-[18px] font-semibold">
            After Basic
          </button>
        )
      ) : (
        <CustomButton
          variant="filled"
          type="submit"
          disabled={isVerified}
          onClick={onButtonClick}
          className={`w-full text-xl font-semibold ${buttonClassName || ""}`}
        >
          {isVerified ? "Verified" : "Verify Now"}
        </CustomButton>
      )}

      <div className="flex flex-col gap-4 mt-6">
        {features.map((item) => {
          const hasAccess =
            accessLevel === "basic" ? item.basic : item.advanced;
          return (
            <div key={item.label} className="flex items-center gap-2">
              {hasAccess ? (
                <Check className="text-success" size={24} />
              ) : (
                <X className="text-error" size={24} />
              )}
              <span className="text-xs font-bold">{item.label}</span>
            </div>
          );
        })}
      </div>
    </CardView>
  );
};

export default function Kyc() {
  const [showBasicSection, setShowBasicSection] = useState(false);
  const [showAdvanceSection, setShowAdvanceSection] = useState(false);
  const [isBasicVerified, setIsBasicVerified] = useState(false);

  const handleBasicCompletion = () => {
    setIsBasicVerified(true);
    setShowBasicSection(false);
  };

  const handleUpgradeToAdvance = () => {
    setShowBasicSection(false);
    setShowAdvanceSection(true);
  };

  return (
    <div className="w-full h-full flex justify-center items-center gap-12">
      {showBasicSection ? (
        <BasicSection
          onComplete={handleBasicCompletion}
          onUpgrade={handleUpgradeToAdvance}
        />
      ) : showAdvanceSection ? (
        <AdvanceSection />
      ) : (
        <>
          <KycCard
            title="Basic"
            details={basicDetails}
            accessLevel="basic"
            onButtonClick={() => setShowBasicSection(true)}
            isVerified={isBasicVerified}
          />
          <KycCard
            title="Advance"
            details={advancedDetails}
            accessLevel="advanced"
            buttonClassName="bg-gray-300"
            onButtonClick={() => setShowAdvanceSection(true)}
            isVerified={isBasicVerified}
          />
        </>
      )}
    </div>
  );
}
