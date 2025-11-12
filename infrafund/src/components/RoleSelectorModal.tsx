"use client";

import React, { useState } from "react";

interface RoleSelectorModalProps {
    open: boolean;
    onClose: () => void;
    onComplete: (role: string, userType: "individual" | "business") => void;
}

const roles = [
    { key: "client", label: "Raise Fund" },
    { key: "investor", label: "Invest" },
    { key: "auditor", label: "Audit" },
    { key: "gc", label: "Contract" },
];

const userTypes: { key: "individual" | "business"; label: string }[] = [
    { key: "individual", label: "Individual" },
    { key: "business", label: "Organization" },
];

export default function RoleSelectorModal({
    open,
    onClose,
    onComplete,
}: RoleSelectorModalProps) {
    const [step, setStep] = useState<"role" | "type">("role");
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    if (!open) return null;

    const handleRoleSelect = (role: string) => {
        setSelectedRole(role);
        setStep("type");
    };

    const handleTypeSelect = (type: "individual" | "business") => {
        if (selectedRole) {
            onComplete(selectedRole, type);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
            <div className="bg-[#1A1A1C] rounded-2xl p-8 w-[90%] max-w-md text-center text-white shadow-xl">
                {step === "role" ? (
                    <>
                        <h2 className="text-2xl font-bold mb-6">What do you want to do?</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {roles.map((r) => (
                                <button
                                    key={r.key}
                                    onClick={() => handleRoleSelect(r.key)}
                                    className="bg-[#2A2A2D] hover:bg-[#3A3A3D] rounded-xl py-4 text-lg font-medium transition"
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold mb-6">Choose your type</h2>
                        <div className="flex flex-col gap-4">
                            {userTypes.map((t) => (
                                <button
                                    key={t.key}
                                    onClick={() => handleTypeSelect(t.key)}
                                    className="bg-[#2A2A2D] hover:bg-[#3A3A3D] rounded-xl py-4 text-lg font-medium transition"
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setStep("role")}
                            className="mt-6 text-gray-400 text-sm underline hover:text-gray-300"
                        >
                            Back
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
