"use client";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center w-full">
      {steps.map((_, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`w-[32px] h-1 transition-colors duration-200 rounded-[30px] ${
              index === currentStep - 1 ? "bg-primary" : "bg-gray-400"
            }`}
          />
          {index < steps.length - 1 && <div className="w-4" />}
        </div>
      ))}
    </div>
  );
}
