"use client";

import React from "react";
import clsx from "clsx";

interface CardViewProps {
  width?: string;
  height?: string;
  padding?: string;
  font?: string;
  BackgroundColor?: string;
  className?: string;
  children: React.ReactNode;
}

export default function CardView({
  children,
  padding = "p-4",
  width = "w-full",
  height = "h-auto",
  BackgroundColor = "bg-card-bg",
  font = "text-base font-normal",
  className = "",
}: CardViewProps) {
  return (
    <div
      className={clsx(
        "flex flex-col justify-evenly items-start  border border-card-bg-border backdrop-blur-3xl rounded-[40px]",
        padding,
        width,
        BackgroundColor,
        height,
        font,
        className
      )}
    >
      {children}
    </div>
  );
}
