'use client';

import React, { useState, useEffect } from 'react';
import CardView from '@/components/ui/card-view';
import { FormInput } from '@/components/ui/form-input';
import { useUser } from '@/hooks/useUser';
import { Camera } from 'lucide-react';

export default function PersonalInformation() {
    const { userName } = useUser();
    const avatarLabel = userName.trim().charAt(0).toUpperCase() || 'G';

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
    });

    useEffect(() => {
        if (userName && userName !== 'Guest') {
            const names = userName.trim().split(' ');
            setFormData(prev => ({
                ...prev,
                firstName: names[0] || '',
                lastName: names.length > 1 ? names.slice(1).join(' ') : '',
            }));
        }
    }, [userName]);

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const userdetail = [
        {
            title: "First Name",
            value: formData.firstName,
            field: 'firstName' as const,
        },
        {
            title: "Last Name",
            value: formData.lastName,
            field: 'lastName' as const,
        },
        {
            title: "Phone Number",
            value: formData.phoneNumber,
            field: 'phoneNumber' as const,
        },

    ];

    return (
        <CardView className="rounded-xl gap-6 p-6">
            <h2 className="text-2xl text-heading-text font-semibold">
                Personal Information
            </h2>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex flex-col items-center gap-1">
                    <div className='w-20 h-20 relative flex justify-center items-center bg-[#263247] rounded-full'>
                        <span className='text-white text-2xl font-medium'>{avatarLabel}</span>
                        <div className='w-6 h-6 rounded-full bg-primary text-black absolute bottom-0 right-0 flex justify-center items-center cursor-pointer'>
                            <Camera size={15} />
                        </div>
                    </div>

                    <h3 className="text-sm font-normal text-gray-50">
                        {userName === 'Guest' ? 'Your Name' : userName}
                    </h3>
                    <p className="text-gray-500 text-xs font-normal">
                        {formData.email || 'your@email.com'}
                    </p>
                </div>

                <div className="flex justify-between items-center gap-6">
                    {userdetail.map((item, index) => (
                        <FormInput
                            className='w-63'
                            key={index}
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