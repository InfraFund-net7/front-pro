'use client';
interface FormInputProps {
  label?: string;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  prefix?: string;
  disabled?: boolean;
}

export function FormInput({
  label,
  placeholder = '',
  type = 'text',
  icon,
  value,
  onChange,
  className = '',
  prefix,
  disabled = false,
}: FormInputProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-white text-sm font-medium">{label}</label>
      )}

      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400 font-medium">
            {prefix}
          </div>
        )}

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full bg-[#131C2F] text-white placeholder-placeholder-text 
                     focus:outline-none focus:ring-2 focus:ring-active-green 
                     transition-colors duration-200 rounded-lg py-3
                     ${prefix ? 'pl-10' : 'px-4'}
                     ${icon ? 'pr-11' : 'pr-4'}
                     ${disabled ? 'opacity-75 cursor-not-allowed' : ''}`}
        />
        {icon && (
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}