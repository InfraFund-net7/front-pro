"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useAccount, useWallets, useDisconnect, useModal } from "@particle-network/connectkit";
import apiService from "@/services/api.service";
import { BrowserProvider } from "ethers"; // ethers v6

// Types
interface SurveyData {
    role: string;
    type: "individual" | "organization";
    confirm_tos: boolean;
    first_name?: string;
    last_name?: string;
    phone_number: string;
    email: string;
    contact_fullname?: string;
    company_name?: string;
}

interface AutoWalletRegisterProps {
    surveyData?: SurveyData;
}

// Component
function AutoWalletRegisterContent({ surveyData }: AutoWalletRegisterProps) {
    const { address, isConnected } = useAccount();
    const wallets = useWallets();
    const { disconnect } = useDisconnect();
    const { setOpen } = useModal();

    const [registerLoading, setRegisterLoading] = useState(false);
    const [registerSuccess, setRegisterSuccess] = useState(false);

    // Auto-open modal if not connected
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isConnected) {
                setOpen(true);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [isConnected, setOpen]);

    // Auto-trigger register when wallet is ready
    useEffect(() => {
        if (isConnected && address && wallets.length > 0 && !registerLoading && !registerSuccess) {
            setRegisterLoading(true);
            handleAutoRegister();
        }
    }, [isConnected, address, wallets.length, registerLoading, registerSuccess]);

    // داخل AutoWalletRegisterContent

    const handleAutoRegister = async () => {
        try {
            if (!address) throw new Error("No wallet address available");

            // 🪙 مرحله ۱: Challenge برای register
            const regChallengeResp = await apiService.post<{ message: string }>("/auth/challenge", {
                wallet_address: address,
                challenge_type: "registration",
            });

            const regMessage = regChallengeResp.data.message.trim();
            if (!regMessage) throw new Error("Registration challenge message is empty");

            const regSignature = await signMessage(regMessage, address); // ← تابع مجزا برای sign

            // 📤 مرحله ۲: Register
            const payload = {
                wallet_address: address,
                signature: regSignature,
                country: "uk",
                ...(surveyData && {
                    role: surveyData.role === "Raise Funds (Project Developer)" ? "developer" : surveyData.role,
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
            console.log("✅ Registration succeeded:", registerResp.data);

            // ✅ حالا login می‌کنیم — بعد از register
            await handleLoginAfterRegister(address);
        } catch (err: any) {
            handleError(err, "Registration");
        }
    };

    // 🔐 تابع مجزا برای امضا — قابل استفاده در چند جا
    const signMessage = async (message: string, address: string): Promise<string> => {
        console.log("✍️ Signing message:", message);

        if (typeof window !== "undefined" && (window as any).ethereum) {
            try {
                const provider = new BrowserProvider((window as any).ethereum);
                const signer = await provider.getSigner(address as `0x${string}`);
                return await signer.signMessage(message);
            } catch (ethersErr) {
                console.warn("ethers fallback to Particle", (ethersErr as Error).message);
            }
        }

        // fallback to Particle viem
        const walletClient = wallets[0]?.getWalletClient();
        if (!walletClient) throw new Error("No wallet client found for signing");
        return await walletClient.signMessage({
            message,
            account: address as `0x${string}`,
        });
    };

    // 🔑 مرحله بعدی: لاگین پس از register
    const handleLoginAfterRegister = async (walletAddress: string) => {
        setRegisterLoading(true); // می‌تونی یه state جدید مثل loginLoading بسازی

        try {
            // 🔐 challenge نوع login
            const loginChallengeResp = await apiService.post<{ message: string }>("/auth/challenge", {
                wallet_address: walletAddress,
                challenge_type: "login",
            });

            const loginMessage = loginChallengeResp.data.message.trim();
            if (!loginMessage) throw new Error("Login challenge message is empty");

            const loginSignature = await signMessage(loginMessage, walletAddress);

            // 🚀 login
            const loginResp = await apiService.post<{ token: string; user: any }>("/auth/login", {
                wallet_address: walletAddress,
                signature: loginSignature,
            });

            const { token, user } = loginResp.data;
            if (!token) throw new Error("No token received");

            // ✅ ذخیره توکن (بسته به معماری‌تون)
            localStorage.setItem("auth_token", token);
            // اگر از context یا Zustand استفاده می‌کنی، اینجا آپدیتش کن:
            // e.g., setAuth({ token, user });

            console.log("✅ Login successful. Token stored.");
            setRegisterSuccess(true);

            // 🔄 redirect به داشبورد — مثلاً بعد از ۱ ثانیه
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 1000);
        } catch (err: any) {
            handleError(err, "Login after registration");
        } finally {
            setRegisterLoading(false);
        }
    };

    // 🛑 تابع مدیریت خطا (کد تمیزتر)
    const handleError = (err: any, stage: string) => {
        console.error(`❌ ${stage} failed:`, {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
        });

        const errorMsg = err.response?.data?.message || err.message || "Unknown error";
        alert(`❌ ${stage} failed:\n${errorMsg}`);
        setRegisterLoading(false);
    };

    // ✅ خارج از handleAutoRegister — جابه‌جا شد!
    const handleDisconnect = () => {
        disconnect();
        setRegisterLoading(false);
        setRegisterSuccess(false);
        setOpen(false);
        alert("Wallet disconnected. You can reconnect anytime.");
    };

    return (
        <div className="w-full h-full px-4 py-8 bg-gray-900 sm:px-6 sm:py-12 md:w-auto md:max-w-lg md:mx-auto md:my-auto md:p-8 md:h-auto md:rounded-lg md:shadow-xl">
            <div className="flex flex-col h-full justify-between md:h-auto">
                <div className="text-center">
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
                                <button
                                    className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-md text-sm cursor-not-allowed"
                                    disabled
                                >
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

// Export with Suspense wrapper
export default function AutoWalletRegister({ surveyData }: AutoWalletRegisterProps) {
    return (
        <Suspense fallback={<div className="p-8 text-white">Loading wallet connection...</div>}>
            <AutoWalletRegisterContent surveyData={surveyData} />
        </Suspense>
    );
}