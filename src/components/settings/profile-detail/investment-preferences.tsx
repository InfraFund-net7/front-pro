'use client';

import { useState } from 'react';
import CardView from '@/components/ui/card-view';
import { FormInput } from '@/components/ui/form-input';
import { Dropdown } from '@/components/ui/dropdown';

const RISK_OPTIONS = [
  { key: 'low', label: 'Low', value: 'Low' },
  { key: 'medium', label: 'Medium', value: 'Medium' },
  { key: 'high', label: 'High', value: 'High' },
  { key: 'very-high', label: 'Very High', value: 'Very High' },
];

export function InvestmentPreferences() {
  // TODO(task-113-followup): persist preferences via PUT /api/v1/account/me
  // (or a dedicated /preferences endpoint) once the data model exists.
  const [formData, setFormData] = useState({
    riskTolerance: 'Medium',
    sectorFocus: '',
    minInvestment: '',
    registeredAddress: '',
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <CardView className="rounded-xl gap-6 p-6 h-full">
      <h2 className="text-2xl text-heading-text font-semibold">
        Investment Preferences
      </h2>
      <div className="flex justify-between items-center gap-6 w-full">
        <Dropdown
          label="Risk Tolerance"
          options={RISK_OPTIONS}
          value={formData.riskTolerance}
          className="w-76.5"
          onChange={(value) => handleChange('riskTolerance', value)}
          placeholder="Select risk tolerance"
        />
        <FormInput
          label="Sector Focus"
          value={formData.sectorFocus}
          className="w-76.5"
          placeholder="e.g. Solar, Wind, Real Estate"
          onChange={(e) => handleChange('sectorFocus', e.target.value)}
        />
        <FormInput
          label="Min. Investment"
          value={formData.minInvestment}
          className="w-76.5"
          placeholder="1000"
          onChange={(e) => handleChange('minInvestment', e.target.value)}
          prefix="£"
        />
      </div>
      <div className="gap-6 flex flex-col w-full h-28">
        <span className="text-base font-medium text-[#C9D1D9]">
          Registered Address
        </span>
        <textarea
          placeholder="Enter your registered address"
          value={formData.registeredAddress}
          onChange={(e) => handleChange('registeredAddress', e.target.value)}
          className="w-full bg-[#131C2F] text-white placeholder-placeholder-text focus:outline-none focus:ring-2 focus:ring-active-green transition-colors duration-200 rounded-lg p-3"
        />
      </div>
    </CardView>
  );
}
