interface HorizontalProgressBarProps {
  steps: number;
  currentStep: number;
  className?: string;
  stepClassName?: string;
  completedColor?: string;
  inProgressColor?: string;
  notStartedColor?: string;
  gap?: string;
}

export function HorizontalProgressBar({
  steps,
  currentStep,
  className = "",
  stepClassName = "",
  completedColor = "bg-primary",
  inProgressColor = "bg-primary-300",
  notStartedColor = "bg-[#151E2F]",
  gap = "gap-2",
}: HorizontalProgressBarProps) {
  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {Array.from({ length: steps }, (_, index) => {
        const stepNumber = index + 1;
        let stepState: "completed" | "in-progress" | "not-started";

        if (stepNumber < currentStep) {
          stepState = "completed";
        } else if (stepNumber === currentStep) {
          stepState = "in-progress";
        } else {
          stepState = "not-started";
        }

        return (
          <div
            key={index}
            className={`w-[75px] h-[6px] rounded-full relative overflow-hidden ${notStartedColor} ${stepClassName}`}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ease-in-out ${
                stepState === "completed"
                  ? completedColor
                  : stepState === "in-progress"
                  ? inProgressColor
                  : "w-0"
              }`}
              style={{
                width:
                  stepState === "completed"
                    ? "100%"
                    : stepState === "in-progress"
                    ? "50%"
                    : "0%",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
