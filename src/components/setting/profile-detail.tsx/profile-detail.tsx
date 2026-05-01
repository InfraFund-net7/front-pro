'use client';

import { CustomButton } from "@/components/ui/custom-button";
import InvestmentPreferences from "./investment-preferences";
import PersonalInformation from "./personal-information";
import RoleAccess from "./role-access";

export default function ProfileDetail() {
    return (
        <div className='flex flex-col gap-4 justify-center items-center'>
            <PersonalInformation />
            <RoleAccess />
            <InvestmentPreferences />
            <div className="w-full h-fit flex justify-end items-center gap-6">
                <CustomButton variant="canceled" className="w-fit h-10 flex justify-center items-center">
                    <span className="text-sm font-semibold">Discard Changes</span>
                </CustomButton>
                <CustomButton variant="filled" className="w-31.5 h-10 flex justify-center items-center">
                    <span className="text-sm font-semibold">Save</span>
                </CustomButton>
            </div>
        </div>
    );
}