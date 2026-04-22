import { FormInput } from '@/components/ui/form-input';
import MilestoneCard from '@/components/ui/MilestoneCard';
import React from 'react';

export default function CharityCrowdfunding() {
  return (
    <div className="flex flex-col gap-6">
      <span className="text-3xl text-white">
        Charity-Base Crowdfunding Details
      </span>
      <div className="grid grid-cols-2 gap-6 w-full">
        <FormInput
          label="Token Name"
          placeholder="Token Name"
          className="w-full"
        />
        <FormInput
          label="Digital Asset Symbol"
          placeholder="e.g. $INF"
          className="w-full"
        />
        <FormInput
          label="Digital Asset Supply"
          placeholder="Total supply"
          className="w-full"
        />
        <FormInput label="Price" placeholder="Price" className="w-full" />
        <FormInput
          label="Min Raise"
          placeholder="Min Raise"
          className="w-full"
        />
        <FormInput
          label="Max Raise"
          placeholder="Max Raise"
          className="w-full"
        />
        <FormInput
          label="Min Donation"
          placeholder="Min Donation"
          className="w-full"
        />
        <FormInput
          label="Max Donation"
          placeholder="Max Donation"
          className="w-full"
        />
        <FormInput
          label="Start Date"
          placeholder="Start Date"
          className="w-full"
        />
        <FormInput label="End Date" placeholder="End Date" className="w-full" />
      </div>
      <MilestoneCard />
      <FormInput
        label="General Contractor (GC) Wallet Address"
        placeholder="Wallet Address"
        className="w-full"
      />
      <FormInput
        label="Pledge Address"
        placeholder="Pledge Address"
        className="w-full"
      />
    </div>
  );
}
