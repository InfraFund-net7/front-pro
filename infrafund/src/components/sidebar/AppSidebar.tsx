"use client";

import React from "react";
import { NAVIGATION } from "./sidebarData";
import Navigation from "./Navigation";

type Role = "gc" | "client" | "investor" | "auditor";
type UserType = "individual" | "business";

interface AppSidebarProps {
  role?: Role;
  type?: UserType;
  verified?: boolean;
  className?: string;
}

export default function AppSidebar({
  role,
  type,
  verified,
  className = "",
}: AppSidebarProps) {
  if (!role || !type) {
    return (
      <aside
        className={`bg-card-bg border-card-bg-border text-white w-[261px] flex flex-col rounded-[40px] py-8 h-[928px] ${className}`}
      >
        <div className="flex justify-start px-7">
          <span className="text-xl font-bold">Logo</span>
        </div>
        <div className="flex-1 mt-6 px-4">
          <Navigation items={[]} />
        </div>
      </aside>
    );
  }

  const items = NAVIGATION[role][type].verified.map((item) => {
    if (!verified && item.disabled !== true) {
      return { ...item, disabled: true };
    }
    return item;
  });

  const unverifiedItems = NAVIGATION[role][type].unverified.map((item) => ({
    ...item,
    disabled: false,
  }));

  const finalItems = [...unverifiedItems, ...items];

  return (
    <aside
      className={`bg-card-bg border-card-bg-border text-white w-[261px] flex flex-col rounded-[40px] py-8 h-[928px] ${className}`}
    >
      <div className="flex justify-start px-7">
        <span className="text-xl font-bold">Logo</span>
      </div>
      <div className="flex-1 mt-6 px-4">
        <Navigation items={finalItems} />
      </div>
    </aside>
  );
}
