'use client';

import { Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import CardView from '@/components/ui/card-view';
import { FormInput } from '@/components/ui/form-input';
import { useAuthSession } from '@/components/auth/auth-session-provider';

export function PersonalInformation() {
  const { backendUser, openfortUser } = useAuthSession();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
  });

  useEffect(() => {
    setFormData({
      firstName: backendUser?.first_name ?? '',
      lastName: backendUser?.last_name ?? '',
      phoneNumber: backendUser?.phone_number ?? '',
      email: backendUser?.email ?? openfortUser?.email ?? '',
    });
  }, [
    backendUser?.first_name,
    backendUser?.last_name,
    backendUser?.phone_number,
    backendUser?.email,
    openfortUser?.email,
  ]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const displayName =
    [formData.firstName, formData.lastName].filter(Boolean).join(' ') ||
    openfortUser?.name ||
    'Your Name';
  const avatarLabel = displayName.charAt(0).toUpperCase() || 'G';

  const fields = [
    {
      title: 'First Name',
      field: 'firstName' as const,
      value: formData.firstName,
    },
    {
      title: 'Last Name',
      field: 'lastName' as const,
      value: formData.lastName,
    },
    {
      title: 'Phone Number',
      field: 'phoneNumber' as const,
      value: formData.phoneNumber,
    },
  ];

  return (
    <CardView className="rounded-xl gap-6 p-6">
      <h2 className="text-2xl text-heading-text font-semibold">
        Personal Information
      </h2>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex flex-col items-center gap-1">
          <div className="w-20 h-20 relative flex justify-center items-center bg-[#263247] rounded-full">
            <span className="text-white text-2xl font-medium">
              {avatarLabel}
            </span>
            <button
              type="button"
              aria-label="Change profile photo"
              className="w-6 h-6 rounded-full bg-primary text-black absolute bottom-0 right-0 flex justify-center items-center cursor-pointer"
            >
              <Camera size={15} />
            </button>
          </div>

          <h3 className="text-sm font-normal text-gray-50">{displayName}</h3>
          <p className="text-gray-500 text-xs font-normal">
            {formData.email || 'your@email.com'}
          </p>
        </div>

        <div className="flex justify-between items-center gap-6">
          {fields.map((item) => (
            <FormInput
              key={item.field}
              className="w-63"
              label={item.title}
              value={item.value}
              placeholder={`Enter your ${item.title.toLowerCase()}`}
              onChange={(e) => handleChange(item.field, e.target.value)}
            />
          ))}
        </div>
      </div>
    </CardView>
  );
}
