"use client";

import type { HTMLAttributes } from "react";

interface CustomCheckboxProps extends HTMLAttributes<HTMLDivElement> {
  checked: boolean;
  onToggle: () => void;
}

export function CustomCheckbox({
  checked,
  onToggle,
  className,
  ...props
}: CustomCheckboxProps) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`w-8 h-8 rounded-lg border-2 cursor-pointer flex items-center justify-center
        ${
          checked
            ? "bg-primary border-primary"
            : "bg-transparent border-gray-500"
        }
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900
        ${className || ""}`}
      {...props}
    >
      <span className="sr-only">{checked ? "Checked" : "Unchecked"}</span>

      {checked && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </div>
  );
}
