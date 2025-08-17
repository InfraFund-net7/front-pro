import React, { useState, useEffect } from "react";
import { ArrowLeft, ShieldCheck, ShieldX } from "lucide-react";
import CardView from "@/components/ui/card-view";
import { FormInput } from "@/components/ui/form-input";
import { CustomButton } from "@/components/ui/custom-button";
import PersonalModal from "../personal-modal";
import ApplicationForm from "../ApplicationForm";
import PreSaleProject from "./pre-sale-project";

export default function PreSaleSection() {
  const [symbol, setSymbol] = useState("");
  const [status, setStatus] = useState<null | "available" | "taken">(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    if (!symbol.startsWith("$")) {
      setStatus(null);
      return;
    }

    const cleanSymbol = symbol.slice(1).toUpperCase();

    if (cleanSymbol === "BNB") {
      setStatus("taken");
    } else if (cleanSymbol === "INF") {
      setStatus("available");
    } else {
      setStatus(null);
    }
  }, [symbol]);

  return (
    <CardView
      width="1015px"
      height="728px"
      padding="p-12"
      className="gap-80 flex flex-col justify-between"
    >
      {showApplicationForm ? (
        <ApplicationForm CrowdfundingComponent={PreSaleProject} />
      ) : (
        <>
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-2">
              <span className="text-4xl font-semibold text-white">
                Set Your Asset Symbol
              </span>
              <span className="text-base font-normal text-[#C7CAD5]">
                This symbol will represent your token across the platform. It
                must be unique and 3–6 characters long.
              </span>
            </div>

            <div className="flex flex-col gap-2 w-fit h-fit">
              <FormInput
                label="Digital Asset Symbol"
                placeholder="e.g. $INF"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />

              {symbol && !symbol.startsWith("$") && (
                <div className="flex items-center gap-1 text-error">
                  <ShieldX size={20} />
                  <span className="text-xs font-normal">
                    Symbol must start with $
                  </span>
                </div>
              )}
              {status === "taken" && (
                <div className="flex items-center gap-1 text-error">
                  <ShieldX size={20} />
                  <span className="text-xs font-normal">Already taken!</span>
                </div>
              )}
              {status === "available" && (
                <div className="flex items-center gap-1 text-success">
                  <ShieldCheck size={20} />
                  <span className=" text-xs font-normal">Available.</span>
                </div>
              )}
            </div>
          </div>
          <div className="w-full h-fit flex justify-between items-center">
            <CustomButton
              variant="canceled"
              className="w-32 h-11 flex justify-center items-center gap-2"
            >
              <ArrowLeft size={24} />
              Back
            </CustomButton>
            <CustomButton
              variant="filled"
              className="w-32 h-11 flex justify-center items-center"
              onClick={() => setIsModalOpen(true)}
            >
              Continue
            </CustomButton>
          </div>
          <PersonalModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onContinue={() => {
              setIsModalOpen(false);
              setShowApplicationForm(true);
            }}
          />
        </>
      )}
    </CardView>
  );
}
