"use client";

import * as React from "react";

interface SelectTypeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}

export function SelectTypeButton({
  icon,
  children,
  className,
  ...props
}: SelectTypeButtonProps) {
  const [isActive, setIsActive] = React.useState(false);

  return (
    <button
      onClick={() => setIsActive(!isActive)}
      className={`
        flex items-center gap-3 px-6 py-4 rounded-xl text-lg font-mono 
        transition-colors duration-200 ease-in-out
        ${
          isActive
            ? "bg-[#132F21] text-primary border border-primary"
            : "bg-[#1A1E28] text-[#E0E0E0] border border-transparent"
        }
        ${
          !isActive
            ? "hover:bg-[#2A2E38] hover:border-primary hover:text-[#F0F0F0]"
            : ""
        }
        cursor-pointer ${className || ""}
      `}
      {...props}
    >
      {React.cloneElement(icon, {
        className: `w-6 h-6 ${
          isActive ? "text-primary" : "text-[#E0E0E0]"
        }`,
      })}
      {children}
    </button>
  );
}
