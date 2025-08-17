"use client";

interface ToggleSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  className?: string;
  disabled?: boolean;
}

export function ToggleSwitch({
  isOn,
  onToggle,
  className = "",
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`w-[42px] h-[24px] rounded-full relative transition-all duration-300 ease-in-out outline-none border-none ${
        isOn ? "bg-primary" : "bg-gray-600"
      } ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      <div
        className={`w-[28px] h-[28px] bg-primary-300 rounded-full absolute top-[-2px] transition-all duration-300 ease-in-out ${
          isOn ? "left-[16px]" : "left-[-2px]"
        }`}
      />
    </button>
  );
}
