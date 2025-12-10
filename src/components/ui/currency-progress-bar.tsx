interface ProgressBarProps {
  currentAmount: number
  totalAmount: number
  currency: string
}

export default function CurrencyProgressBar({ currentAmount, totalAmount, currency }: ProgressBarProps) {
  const progressPercentage = (currentAmount / totalAmount) * 100

  return (
    <div className="flex flex-col items-start justify-center gap-3 h-fit w-full">
      <div className="text-lg font-bold flex items-baseline">
        <span className="text-primary">{currentAmount.toLocaleString()}</span>
        <span className="text-white">
          /{totalAmount.toLocaleString()} {currency}
        </span>
      </div>
      <div className="w-full h-3 bg-black rounded-full overflow-hidden">
        <div
          className="h-full w-full bg-primary text-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  )
}
