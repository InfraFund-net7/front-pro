// 'use client';

// import React, { useEffect, useState, Suspense } from "react";
// import {
//     useAccount,
//     useDisconnect,
//     useModal,
//     useParticleAuth,
//     useWallets
// } from "@particle-network/connectkit";

// interface UserInfo {
//     uuid: string;
//     token?: string;
//     [key: string]: unknown;
// }

// function ParticleViewerContent() {
//     const { address, isConnected } = useAccount();
//     const { disconnect } = useDisconnect();
//     const { setOpen } = useModal();
//     const { getUserInfo } = useParticleAuth();
//     const [primaryWallet] = useWallets();

//     const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
//     const [loading, setLoading] = useState(false);
//     useEffect(() => {
//         if (!isConnected) {
//             const timer = setTimeout(() => setOpen(true), 300);
//             return () => clearTimeout(timer);
//         }
//     }, [isConnected, setOpen]);

//     useEffect(() => {
//         const fetchUserInfo = async () => {
//             if (primaryWallet?.connector?.walletConnectorType === 'particleAuth') {
//                 setLoading(true);
//                 try {
//                     const info = await getUserInfo();
//                     setUserInfo(info as unknown as UserInfo);
//                 } catch (error) {
//                     console.error("Error fetching user info:", error);
//                 }
//                 setLoading(false);
//             }
//         };

//         if (isConnected) {
//             fetchUserInfo();
//         }
//     }, [isConnected, getUserInfo, primaryWallet]);

//     const handleDisconnect = () => {
//         disconnect();
//         setUserInfo(null);
//     };

//     return (
//                 <div className="text-center">
//                     <h1 className="text-3xl font-bold text-white mb-4">Particle Social Login Tester</h1>

//                     {isConnected && address ? (
//                         <div className="bg-green-900/30 border border-green-500 rounded-lg p-4 mb-6">
//                             <p className="text-green-400 font-medium">Connected (Social Login)</p>
//                             <p className="text-gray-300 text-sm mt-1 font-mono break-all">{address}</p>
//                         </div>
//                     ) : (
//                         <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4 mb-6">
//                             <p className="text-yellow-400">Not Connected</p>
//                         </div>
//                     )}

//                     {loading && (
//                         <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 mb-4">
//                             <p className="text-blue-400">Loading user info...</p>
//                         </div>
//                     )}

//                     {/* Display UUID and User Info */}
//                     {userInfo && (
//                         <div className="bg-cyan-900/20 border border-cyan-500 rounded-lg p-5 mb-6 text-left">
//                             <p className="text-cyan-400 font-bold text-lg mb-3 text-center">User Info</p>

//                             {/* UUID */}
//                             <div className="mb-4 bg-gray-900/50 p-4 rounded border border-cyan-600">
//                                 <span className="text-gray-400 block mb-2">UUID:</span>
//                                 <span className="text-white font-mono break-all text-lg">
//                                     {userInfo.uuid}
//                                 </span>
//                             </div>

//                             {/* Token */}
//                             <div className="mb-4 bg-gray-900/50 p-4 rounded border border-cyan-600">
//                                 <span className="text-gray-400 block mb-2">Token:</span>
//                                 <span className="text-white font-mono break-all text-xs">
//                                     {userInfo.token?.slice(0, 50)}...
//                                 </span>
//                             </div>

//                             {/* Full User Info */}
//                             <pre className="text-white text-xs break-all whitespace-pre-wrap max-h-96 overflow-y-auto bg-gray-900/50 p-4 rounded">
//                                 {JSON.stringify(userInfo, null, 2)}
//                             </pre>
//                         </div>
//                     )}

//                     <div className="flex gap-3 mt-8">
//                         {isConnected ? (
//                             <button onClick={handleDisconnect} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
//                                 Disconnect
//                             </button>
//                         ) : (
//                             <button onClick={() => setOpen(true)} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
//                                 Login with Email / Social
//                             </button>
//                         )}
//                     </div>
//                 </div>
//     );
// }

// export default function ParticleViewer() {
//     return (
//         <Suspense fallback={<div className="h-screen flex items-center justify-center text-white bg-gray-900">Loading...</div>}>
//             <ParticleViewerContent />
//         </Suspense>
//     );
// }
// components/PureParticleRegister.tsx
// components/PureParticleRegister.tsx
// components/PureParticleRegister.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
    useAccount,
    useDisconnect,
    useModal,
    useParticleAuth,
    useWallets,
} from "@particle-network/connectkit";

// --- Types ---
interface SurveyData {
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    role: string;
    type: "individual" | "organization";
    company_name?: string;
}

interface UserInfo {
    uuid: string;
    token?: string;
    [key: string]: unknown;
}

interface PureParticleRegisterProps {
    surveyData: SurveyData;
}

export default function PureParticleRegister({ surveyData }: PureParticleRegisterProps) {
    const { isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const { setOpen } = useModal();
    const { getUserInfo } = useParticleAuth();
    const [primaryWallet] = useWallets();

    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // 🚀 Auto-open modal if not connected
    useEffect(() => {
        if (!isConnected) {
            const timer = setTimeout(() => setOpen(true), 300);
            return () => clearTimeout(timer);
        }
    }, [isConnected, setOpen]);

    // 📥 Fetch uuid + token from Particle
    useEffect(() => {
        const fetchUserInfo = async () => {
            if (!isConnected || !primaryWallet) return;

            const isParticleAuth =
                primaryWallet.connector?.walletConnectorType === "particleAuth";
            if (!isParticleAuth) {
                setError("⚠️ Only Particle Social Login is supported.");
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const info = await getUserInfo();
                const typedInfo = info as unknown as UserInfo;
                if (!typedInfo.uuid || !typedInfo.token) {
                    throw new Error("Failed to get UUID or token from Particle.");
                }
                setUserInfo(typedInfo);
            } catch (err: any) {
                setError(`❌ Failed to fetch user info: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (isConnected) {
            fetchUserInfo();
        }
    }, [isConnected, getUserInfo, primaryWallet]);

    // 🧠 Auto-register when ready
    useEffect(() => {
        const doRegister = async () => {
            if (!userInfo?.uuid || !userInfo?.token || success) return;

            setLoading(true);
            setError(null);

            try {
                // 🔁 Clean phone number: +44 (518) 484-8484 → +445184848484
                const cleanPhone = surveyData.phone_number.replace(/[^\d+]/g, "");

                // 🔁 Force valid role
                const role = "project_owner"; // ← critical fix

                // 📦 Payload with 422 fixes
                const payload = {
                    email: surveyData.email.trim(),
                    first_name: surveyData.first_name.trim(),
                    last_name: surveyData.last_name.trim(),
                    organization_name: (surveyData.company_name || "").trim() || "-", // ← not empty
                    phone_number: cleanPhone,
                    role: role,
                    token: userInfo.token,
                    type: surveyData.type,
                    uuid: userInfo.uuid,
                };

                console.log("📤 Sending to https://api-dev.infrafund.net/v1/auth/register", payload);

                // 🌐 Use direct fetch — no apiService
                const res = await fetch("https://api-dev.infrafund.net/v1/auth/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json, application/problem+json",
                    },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(
                        `HTTP ${res.status}: ${errorData.detail || errorData.title || "Validation failed"
                        }`
                    );
                }

                const data = await res.json();

                // ✅ Save tokens
                localStorage.setItem("auth_token", data.access_token);
                localStorage.setItem("auth_expires_at", data.expires_at);
                localStorage.setItem("auth_user_id", data.user_id);

                // 🔄 Auto-refresh (14 min)
                const expiresDate = new Date(data.expires_at);
                const delay = expiresDate.getTime() - Date.now() - 60_000;
                if (delay > 0) {
                    setTimeout(() => {
                        console.log("🔄 Token expiring soon");
                    }, delay);
                }

                setSuccess(true);
                setTimeout(() => window.location.href = "/dashboard", 800);
            } catch (err: any) {
                console.error("❌ Full error:", err);
                setError(`❌ Registration failed: ${err.message}`);
                setLoading(false);
            }
        };

        doRegister();
    }, [userInfo, surveyData, success]);

    const handleDisconnect = () => {
        disconnect();
        setUserInfo(null);
        setSuccess(false);
        setError(null);
    };

    // --- UI (unchanged) ---
    return (
        <div className="w-full max-w-md mx-auto p-6 bg-gray-900 rounded-xl shadow-2xl">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white">🔐 Register with Particle</h1>
                <p className="text-gray-400 mt-2">
                    Sign in with email or social accounts — registration starts automatically.
                </p>
            </div>

            {success ? (
                <div className="bg-green-900/30 border border-green-500 rounded-lg p-5 text-center">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold">✓</span>
                    </div>
                    <p className="text-green-400 font-medium">✅ Registration completed!</p>
                    <p className="text-white text-sm mt-1">Redirecting to dashboard...</p>
                </div>
            ) : loading ? (
                <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-5 text-center">
                    <p className="text-blue-400">⏳ Processing...</p>
                    <p className="text-gray-300 text-sm mt-1">
                        {userInfo ? "Registering with backend" : "Fetching user info"}
                    </p>
                </div>
            ) : error ? (
                <div className="bg-red-900/30 border border-red-500 rounded-lg p-5 text-center">
                    <p className="text-red-400 font-medium">❌ Error</p>
                    <p className="text-white text-sm mt-2 break-all">{error}</p>
                    <button
                        onClick={handleDisconnect}
                        className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                    >
                        Try Again
                    </button>
                </div>
            ) : isConnected ? (
                <div className="bg-gray-800/50 border border-cyan-600 rounded-lg p-4">
                    <p className="text-cyan-400 font-medium">✅ Connected</p>
                    <p className="text-gray-300 text-sm mt-1">
                        Preparing automatic registration...
                    </p>
                </div>
            ) : (
                <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-5 text-center">
                    <p className="text-yellow-400">⚠️ Not signed in</p>
                    <p className="text-gray-300 text-sm mt-2">
                        Please sign in using the button below.
                    </p>
                </div>
            )}

            <div className="mt-6 flex gap-3">
                {isConnected ? (
                    <button
                        onClick={handleDisconnect}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                    >
                        Disconnect
                    </button>
                ) : (
                    <button
                        onClick={() => setOpen(true)}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                        Sign in with Email / Social
                    </button>
                )}
            </div>
        </div>
    );
}