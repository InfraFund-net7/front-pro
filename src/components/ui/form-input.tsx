interface FormInputProps {
  label?: string;
  placeholder: string;
  type?: string;
  icon?: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function FormInput({
  label,
  placeholder,
  type = "text",
  icon,
  value,
  onChange,
  className,
}: FormInputProps) {
  return (
    <div className={`flex flex-col gap-2 ${className || ""}`}>
      <label className="text-white text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full bg-[#131C2F] px-4 py-3 rounded-lg bg-input-background text-white placeholder-placeholder-text focus:outline-none focus:ring-2 focus:ring-active-green transition-colors duration-200"
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
