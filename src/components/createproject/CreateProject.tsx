"use client";
import React, { useState } from "react";
import CardView from "../ui/card-view";
import { SelectTypeButton } from "../ui/select-mode-btn";
import {
  ArrowRight,
  HandHeart,
  Rocket,
  ChartNoAxesCombined,
  CreditCard,
} from "lucide-react";
import PreSale from "./PreSale";
import Equity from "./Equity";
import Debt from "./Debt";
import Charity from "./Charity/Charity";

export default function CreateProject() {
  const ProjectData = [
    {
      title: "Charity",
      description: "",
      icon: HandHeart,
      component: Charity,
    },
    {
      title: "Pre-Sale",
      description: "",
      icon: Rocket,
      component: PreSale,
    },
    {
      title: "Equity",
      description: "",
      icon: ChartNoAxesCombined,
      component: Equity,
    },
    {
      title: "Debt",
      description: "",
      icon: CreditCard,
      component: Debt,
    },
  ];

  const [selected, setSelected] = useState<null | number>(null);

  if (selected !== null) {
    const SelectedComponent = ProjectData[selected].component;
    return <SelectedComponent />;
  }

  return (
    <CardView width="1015px" height="728px" padding="p-12" className="gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-4xl font-semibold text-white">
          Choose crowdfunding models
        </span>
        <span className="text-base font-normal text-[#C7CAD5]">
          The next step is choosing the right funding model. Let’s get you
          started!
        </span>
      </div>
      {ProjectData.map((item, index) => (
        <SelectTypeButton
          key={index}
          icon={<item.icon />}
          className="w-full h-fit"
          onClick={() => setSelected(index)}
        >
          <div className="flex justify-between items-center w-full h-fit ">
            <div className="flex flex-col gap-1 justify-center items-start w-fit">
              <span className="text-lg font-medium text-white">
                {item.title}
              </span>
              <span className="text-sm font-normal text-[#8087A3]">
                Lorem ipsum dolor sit amet consectetur.
              </span>
            </div>
            <ArrowRight className="text-white" size={24} />
          </div>
        </SelectTypeButton>
      ))}
    </CardView>
  );
}
