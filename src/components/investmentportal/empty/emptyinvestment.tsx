import React from 'react';
import emptylogo from '@/../public/assets/svg/emptyinvestment.svg';
import Image from 'next/image';
import { CustomButton } from '@/components/ui/custom-button';
import { PackagePlus } from 'lucide-react';
export default function EmptyInvestment() {
  return (
    <div className="flex flex-col justify-center items-center gap-12 bg-red-500">
      <Image src={emptylogo} width={347} height={280} alt="emptylogo" />
      <p>
        <span className="text-sm text-white font-normal">
          No offering found yet!
        </span>
        <br />
        <span className="text-sm text-[#8087A3] font-normal">
          Your Investment Portal is eagerly awaiting its firstDigital Asset
          Offering.Let’s create one to get started!
        </span>
      </p>
      <CustomButton
        variant="filled"
        className="flex justify-center items-center gap-2 text-black"
      >
        <span className="text-sm font-semibold">
          Create Digital Asset Offering
        </span>
        <PackagePlus size={24} />
      </CustomButton>
    </div>
  );
}
