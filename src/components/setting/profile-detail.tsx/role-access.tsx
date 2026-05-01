import CardView from '@/components/ui/card-view'
import { FormInput } from '@/components/ui/form-input'
import React from 'react'

export default function RoleAccess() {

    return (
        <div className='w-full h-fit flex justify-between items-center gap-4'>
            <CardView className='w-fit h-67.5 rounded-xl gap-6 flex flex-col p-5.75'>
                <h2 className="text-2xl text-heading-text font-semibold text-start">
                    Platform Role & Access
                </h2>
                <div className='w-full flex justify-between items-center gap-5'>
                    <div className='w-30.5 h-30.5 rounded-xl bg-[#63A8FF]' />
                    <div className='flex flex-col justify-center items-start gap-4'>
                        <h3 className='text-base text-gray-50 font-medium'>Investor Role Badge</h3>
                        <p className='text-sm text-gray-300 font-medium'>Access granted via Role NFT <br /> Token ID: 101</p>
                        <span className='text-sm font-semibold text-primary underline-offset-1'>View on Explorer</span>
                    </div>
                </div>
                <span className='text-sm text-gray-700 font-normal text-center w-full'>Your role NFT determines your access level and <br /> permissions within the InfraFund platform.</span>
            </CardView>
            <CardView className='w-fit  h-67.5  rounded-xl p-7 flex flex-col gap-6'>
                <h2 className="text-2xl text-heading-text font-semibold text-start">
                    Investor Profile
                </h2>
                <div className="flex flex-col justify-between items-center gap-6 w-full">
                    <FormInput
                        label="Investor Type"
                        disabled={true}
                        value="Accredited Investor"
                        className='w-full'
                    />
                    <FormInput
                        label="Tax ID / National Insurance No."
                        value="GB123456789"
                        className='w-full'
                    />
                </div>
            </CardView>
        </div>
    )
}