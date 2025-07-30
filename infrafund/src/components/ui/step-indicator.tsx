"use client";

import { useState } from "react";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center space-x-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          {/* Step Circle */}
          <div
            className={`
              w-4 h-4 rounded-full transition-colors duration-200
              ${
                index < currentStep
                  ? "bg-green-500"
                  : index === currentStep
                  ? "bg-green-500"
                  : "bg-gray-400"
              }
            `}
          />

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`
                w-16 h-1 mx-2 transition-colors duration-200
                ${index < currentStep ? "bg-green-500" : "bg-gray-400"}
              `}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Component() {
  const [currentStep, setCurrentStep] = useState(1);
  const steps = ["Step 1", "Step 2", "Step 3", "Step 4"];

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-white text-xl font-semibold mb-8 text-center">
          Step Progress Indicator
        </h2>

        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        {/* Step Labels */}
        <div className="flex justify-between mb-8 text-sm text-gray-300">
          {steps.map((step, index) => (
            <span
              key={index}
              className={`
                ${index <= currentStep ? "text-green-400" : "text-gray-500"}
              `}
            >
              {step}
            </span>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() =>
              setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
            }
            disabled={currentStep === steps.length - 1}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
