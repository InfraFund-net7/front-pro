import Image from "next/image";
import { ChevronDown } from "lucide-react";
import UK from "@/../public/assets/image/uk.png";
interface NationalitySelectProps {
  label: string;
}

export function NationalitySelect({ label }: NationalitySelectProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-white text-sm font-medium">{label}</label>
      <div className="relative w-full px-4 py-3 rounded-lg bg-[#131C2F] text-white flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-3">
          <Image
            src={UK}
            alt="United Kingdom flag"
            width={24}
            height={24}
            className="rounded-full"
          />
          <span>United Kingdom</span>
        </div>
        <ChevronDown className="h-5 w-5 text-white" />
      </div>
    </div>
  );
}
