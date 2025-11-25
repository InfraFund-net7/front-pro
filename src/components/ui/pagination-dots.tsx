interface PaginationDotsProps {
  totalDots: number
  activeIndex: number
}

export function PaginationDots({ totalDots, activeIndex }: PaginationDotsProps) {
  return (
    <div className="flex justify-center gap-2 mt-8">
      {Array.from({ length: totalDots }).map((_, index) => (
        <div
          key={index}
          className={`h-1 w-8 rounded-[34px] transition-colors duration-200 ${
            index === activeIndex ? "bg-primary" : "bg-[#D9D9D9]"
          }`}
        />
      ))}
    </div>
  )
}
