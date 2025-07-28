"use client";

interface TabSelectProps {
  items: string[];
  selectedItem: string;
  onSelect: (item: string) => void;
  className?: string;
}

export function TabSelect({
  items,
  selectedItem,
  onSelect,
  className = "",
}: TabSelectProps) {
  return (
    <div className={`flex items-center gap-8 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="relative">
          <button
            onClick={() => onSelect(item)}
            className={`text-lg font-medium transition-colors duration-300 ease-in-out ${
              selectedItem === item
                ? "text-primary"
                : "text-gray-300 hover:text-gray-100"
            }`}
          >
            {item}
          </button>
          <div
            className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ease-in-out ${
              selectedItem === item ? "w-full opacity-100" : "w-0 opacity-0"
            }`}
            style={{
              transform: selectedItem === item ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left center",
            }}
          />
        </div>
      ))}
    </div>
  );
}
