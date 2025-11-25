import React, { ReactNode } from "react";
import { CalendarDays } from "lucide-react";

// Type for CardView props
interface CardViewProps {
  width: string;
  height: string;
  padding: string;
  children: ReactNode;
}

const CardView = ({ width, height, padding, children }: CardViewProps) => (
  <div className={`${width} ${height} ${padding} bg-white rounded-lg shadow-lg`}>
    {children}
  </div>
);

// Props for select, input, button, and dots
interface NationalitySelectProps {
  label: string;
}

const NationalitySelect = ({ label }: NationalitySelectProps) => (
  <div className="relative">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
      <option>Select Nationality</option>
    </select>
  </div>
);

interface FormInputProps {
  label: string;
  placeholder: string;
  icon?: ReactNode;
}

const FormInput = ({ label, placeholder, icon }: FormInputProps) => (
  <div className="relative">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="mt-1 relative rounded-md shadow-sm">
      <input
        type="text"
        className="block w-full rounded-md border-gray-300 pl-3 pr-10 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        placeholder={placeholder}
      />
      {icon && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {icon}
        </div>
      )}
    </div>
  </div>
);

interface PaginationDotsProps {
  totalDots: number;
  activeIndex: number;
}

const PaginationDots = ({ totalDots, activeIndex }: PaginationDotsProps) => (
  <div className="flex justify-center space-x-2">
    {Array.from({ length: totalDots }).map((_, index) => (
      <div
        key={index}
        className={`w-2 h-2 rounded-full ${
          index === activeIndex ? "bg-blue-500" : "bg-gray-300"
        }`}
      />
    ))}
  </div>
);

interface CustomButtonProps {
  variant: "filled" | "outlined";
  className?: string;
  children: ReactNode;
}

const CustomButton = ({ variant, className = "", children }: CustomButtonProps) => (
  <button
    className={`${className} py-2 px-4 rounded-md ${
      variant === "filled"
        ? "bg-blue-500 text-white"
        : "bg-transparent border border-blue-500 text-blue-500"
    } hover:bg-blue-600 hover:text-white transition-colors`}
  >
    {children}
  </button>
);

// Props for main KycCard component
interface KycCardProps {
  title?: string;
  subtitle?: string;
  nationalityLabel?: string;
  firstNameLabel?: string;
  lastNameLabel?: string;
  middleNameLabel?: string;
  dateOfBirthLabel?: string;
}

const KycCard = ({
  title = "Basic Verification",
  subtitle = "Basic Verification",
  nationalityLabel = "Nationality",
  firstNameLabel = "First Name",
  lastNameLabel = "Last Name",
  middleNameLabel = "Middle Name",
  dateOfBirthLabel = "Date Of Birth",
}: KycCardProps) => {
  return (
    <CardView width="w-[584px]" height="h-[763px]" padding="p-8">
      <div className="flex flex-col gap-2 mb-6">
        <span className="text-[40px] font-semibold text-gray-900">{title}</span>
        <span className="text-sm text-gray-500 font-semibold">{subtitle}</span>
      </div>
      <div className="flex items-center justify-center font-mono">
        <div className="w-full max-w-md mx-auto space-y-6">
          <NationalitySelect label={nationalityLabel} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput label={firstNameLabel} placeholder={firstNameLabel} />
            <FormInput label={lastNameLabel} placeholder={lastNameLabel} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput label={middleNameLabel} placeholder={middleNameLabel} />
            <FormInput
              label={dateOfBirthLabel}
              placeholder={dateOfBirthLabel}
              icon={<CalendarDays className="h-5 w-5 text-gray-400" />}
            />
          </div>

          <PaginationDots totalDots={3} activeIndex={0} />
        </div>
      </div>
      <div className="mt-6">
        <CustomButton variant="filled" className="w-full">
          Continue
        </CustomButton>
      </div>
    </CardView>
  );
};

export default KycCard;