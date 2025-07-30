import React from 'react';
import { CalendarDays } from 'lucide-react';

const CardView = ({ width, height, padding, children }) => (
  <div className={`${width} ${height} ${padding} bg-white rounded-lg shadow-lg`}>
    {children}
  </div>
);

const NationalitySelect = ({ label }) => (
  <div className="relative">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
      <option>Select Nationality</option>
    </select>
  </div>
);

const FormInput = ({ label, placeholder, icon }) => (
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

const PaginationDots = ({ totalDots, activeIndex }) => (
  <div className="flex justify-center space-x-2">
    {Array.from({ length: totalDots }).map((_, index) => (
      <div
        key={index}
        className={`w-2 h-2 rounded-full ${
          index === activeIndex ? 'bg-blue-500' : 'bg-gray-300'
        }`}
      />
    ))}
  </div>
);

const CustomButton = ({ variant, className, children }) => (
  <button
    className={`${className} py-2 px-4 rounded-md ${
      variant === 'filled' ? 'bg-blue-500 text-white' : 'bg-transparent border border-blue-500 text-blue-500'
    } hover:bg-blue-600 hover:text-white transition-colors`}
  >
    {children}
  </button>
);

const KycCard = ({
  title = 'Basic Verification',
  subtitle = 'Basic Verification',
  nationalityLabel = 'Nationality',
  firstNameLabel = 'First Name',
  lastNameLabel = 'Last Name',
  middleNameLabel = 'Middle Name',
  dateOfBirthLabel = 'Date Of Birth',
}) => {
  return (
    <CardView width="w-[584px]" height="h-[763px]" padding="p-8">
      <div className="flex flex-col gap-2">
        <span className="text-[40px] font-semibold text-white">
          {title}
        </span>
        <span className="text-sm text-gray-500 font-semibold">
          {subtitle}
        </span>
      </div>
      <div className="flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-md mx-auto p-6 space-y-6">
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
              icon={<CalendarDays className="h-5 w-5 text-placeholder-text" />}
            />
          </div>

          <PaginationDots totalDots={3} activeIndex={0} />
        </div>
      </div>
      <CustomButton variant="filled" className="w-full">
        Continue
      </CustomButton>
    </CardView>
  );
};

export default KycCard;