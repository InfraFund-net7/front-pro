"use client";
interface SurveyData {
    role: string;
    type: 'individual' | 'organization';
    confirm_tos: boolean;
    first_name?: string;
    last_name?: string;
    phone_number: string;
    email: string;
    contact_fullname?: string;
    company_name?: string;
}
import React, { useEffect, useState, Suspense } from "react";
import { useAccount, useWallets, useDisconnect, useModal } from "@particle-network/connectkit";
import apiService from "@/services/api.service";
import Image from "next/image";
import infafund from "@/../public/assets/svg/infrafund.svg";

interface AutoWalletRegisterProps {
    surveyData?: SurveyData;
}

function AutoWalletRegisterContent({ surveyData }: AutoWalletRegisterProps) {
    const { address, isConnected } = useAccount();
    const wallets = useWallets();
    const { disconnect } = useDisconnect();
    const { setOpen } = useModal(); // ✅ هوک برای کنترل مودال

    const [registerLoading, setRegisterLoading] = useState(false);
    const [registerSuccess, setRegisterSuccess] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isConnected) {
                setOpen(true);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [isConnected, setOpen]);

    useEffect(() => {
        if (isConnected && address && wallets.length > 0 && !registerLoading && !registerSuccess) {
            setRegisterLoading(true);
            handleAutoRegister();
        }
    }, [isConnected, address, wallets.length]);

    const handleAutoRegister = async () => {
        try {
            if (!address) throw new Error("No wallet address available");

            const challengeResp = await apiService.post<{ message: string }>("/auth/challenge", {
                wallet_address: address,
            });

            const rawMessage = challengeResp.data.message;
            if (!rawMessage) throw new Error("Challenge message is empty");

            const message = rawMessage.trim();
            console.log("🔐 Challenge message:", message);

            const walletClient = wallets[0]?.getWalletClient();
            if (!walletClient) throw new Error("Wallet client not available");

            const signature = await walletClient.signMessage({
                message,
                account: address as `0x${string}`,
            });

            console.log("✍️ Signature generated:", signature);

            const payload = {
                wallet_address: address,
                signature,
                message,
                country: "uk",
                ...(surveyData && {
                    role: surveyData.role === "Raise Funds (Project Developer)"
                        ? "developer"
                        : surveyData.role,
                    type: surveyData.type,
                    confirm_tos: surveyData.confirm_tos,
                    first_name: surveyData.first_name || "",
                    last_name: surveyData.last_name || "",
                    phone_number: surveyData.phone_number || "",
                    email: surveyData.email || "",
                    contact_fullname: surveyData.contact_fullname || "",
                    company_name: surveyData.company_name || "",
                }),
            };

            console.log("📤 Register payload:", payload);

            const registerResp = await apiService.post("/auth/register", payload);

            console.log("✅ Registration response:", registerResp.data);
            setRegisterSuccess(true);
        } catch (err: any) {
            console.error("❌ Auto-register failed:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
            });

            const errorMsg = err.response?.data?.message || err.message || "Unknown error";
            alert(`❌ Registration failed:\n${errorMsg}`);

            setRegisterLoading(false);
        }
    };

    const handleDisconnect = () => {
        disconnect();
        setRegisterLoading(false);
        setRegisterSuccess(false);
        setOpen(false); // ✅ بستن مودال اگر باز باشه
        alert("Wallet disconnected. You can reconnect anytime.");
    };

    return (
        <div className="w-full h-full px-4 py-8 bg-gray-900 sm:px-6 sm:py-12 md:w-auto md:max-w-lg md:mx-auto md:my-auto md:p-8 md:h-auto md:rounded-lg md:shadow-xl">
            <div className="flex flex-col h-full justify-between md:h-auto">
                <div className="text-center">
                    <Image priority src={infafund} alt="infafund" width={172} height={42} className="mx-auto mb-4" />
                    <span className="text-2xl text-white font-semibold mb-2 block">🔐 Connect Your Wallet</span>
                    <p className="text-white text-sm mb-4">
                        Please connect your wallet using Particle. Registration will start automatically.
                    </p>

                    {registerSuccess ? (
                        <div className="bg-green-900/30 border border-green-500 rounded-lg p-4 text-center">
                            <span className="text-green-400">✅ Registration completed!</span>
                            <p className="text-white text-sm mt-1">Welcome to InFraFund!</p>
                        </div>
                    ) : registerLoading ? (
                        <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 text-center">
                            <span className="text-blue-400">⏳ Processing...</span>
                            <p className="text-white text-sm mt-1">Getting challenge and signing...</p>
                        </div>
                    ) : isConnected && address ? (
                        <div className="bg-gray-800 p-4 rounded-lg border border-green-500 mb-4">
                            <p className="text-green-400 text-sm">✅ Connected</p>
                            <p className="text-white font-mono text-sm mt-1">
                                {address.slice(0, 6)}...{address.slice(-4)}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-gray-800 p-4 rounded-lg border border-yellow-500 mb-4">
                            <p className="text-yellow-400">⚠️ Not connected</p>
                            <p className="text-white text-sm mt-1">Connecting automatically...</p>
                        </div>
                    )}

                    {isConnected && !registerSuccess && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-4">
                            <button
                                onClick={handleDisconnect}
                                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md text-sm hover:bg-red-500"
                            >
                                Disconnect
                            </button>
                            {registerLoading ? (
                                <button className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-md text-sm cursor-not-allowed" disabled>
                                    Registering...
                                </button>
                            ) : (
                                <button
                                    onClick={handleAutoRegister}
                                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md text-sm hover:bg-green-500"
                                >
                                    Retry Register
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-6 text-center text-xs text-gray-500">
                    {registerSuccess ? "✅ Done" : "Waiting for Wallet Connection..."}
                </div>
            </div>
        </div>
    );
}

export default function AutoWalletRegister({ surveyData }: AutoWalletRegisterProps) {
    return (
        <Suspense fallback={<div className="p-8 text-white">Loading wallet connection...</div>}>
            <AutoWalletRegisterContent surveyData={surveyData} />
        </Suspense>
    );
}