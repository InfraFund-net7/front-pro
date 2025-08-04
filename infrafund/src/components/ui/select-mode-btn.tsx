"use client";

import * as React from "react";

interface SelectTypeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
}

export function SelectTypeButton({
  icon,
  children,
  isActive = false,
  className,
  ...props
}: SelectTypeButtonProps) {
  return (
    <button
      className={`
        flex items-center gap-3 px-6 py-4 rounded-xl text-lg font-mono transition-colors duration-200 ease-in-out
        ${
          isActive
            ? "bg-[#1A3A1A] text-[#00FF00] border border-[#00FF00]"
            : "bg-[#1A1E28] text-[#E0E0E0] border border-transparent"
        }
        ${className || ""}
      `}
      {...props}
    >
      {React.cloneElement(
        icon as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
        {
          className: `w-6 h-6 ${
            isActive ? "text-[#00FF00]" : "text-[#E0E0E0]"
          }`,
        }
      )}
      {children}
    </button>
  );
}
