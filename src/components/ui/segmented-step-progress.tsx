'use client';

interface SegmentedStepProgressProps<TStep extends string> {
  steps: Array<{ id: TStep; label: string }>;
  currentStep: TStep;
  className?: string;
}

export function SegmentedStepProgress<TStep extends string>({
  steps,
  currentStep,
  className = '',
}: SegmentedStepProgressProps<TStep>) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentStep)
  );
  const current = steps[currentIndex] ?? steps[0];

  return (
    <div className={`flex w-full flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          Step {currentIndex + 1}/{steps.length}
        </span>
        <span className="chakra-petch text-sm text-gray-300">
          {current?.label}
        </span>
      </div>
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
        }}
      >
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={step.id}
              className={`h-1.5 rounded-full transition-colors ${
                isComplete || isCurrent ? 'bg-primary' : 'bg-gray-700'
              }`}
              aria-label={`${step.label}: ${isCurrent ? 'current' : isComplete ? 'complete' : 'pending'}`}
            />
          );
        })}
      </div>
    </div>
  );
}
