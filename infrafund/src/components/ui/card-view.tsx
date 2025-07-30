"use client";

import React from "react";
import clsx from "clsx";

interface CardViewProps {
  width?: string;
  height?: string;
  padding?: string;
  font?: string;
  className?: string;
  children: React.ReactNode;
}

export default function CardView({
  children,
  padding = "p-4",
  width = "w-full",
  height = "h-auto",
  font = "text-base font-normal",
  className = "",
}: CardViewProps) {
  return (
    <div
      className={clsx(
        "flex flex-col justify-evenly items-start bg-card-bg border border-card-bg-border backdrop-blur-3xl rounded-[40px]",
        padding,
        width,
        height,
        font,
        className
      )}
    >
      {children}
    </div>
  );
}
