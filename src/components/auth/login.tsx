// app/login/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import CardView from "../ui/card-view";
import infrafund from "@/../public/assets/svg/infrafund.svg";
import Image from "next/image";
import PureParticleRegister from "../AutoWalletRegister"; // ← Ensure this path is correct

// 🔒 Strict type
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

// 🔍 Enhanced cookie reader — with full debug logging
const getSurveyCookieDebug = (): { raw: string | null; decoded: string | null; parsed: SurveyData | null } => {
  if (typeof document === "undefined") {
    console.log("⚠️ SSR: document undefined");
    return { raw: null, decoded: null, parsed: null };
  }

  console.log("🔍 Full document.cookie:", `"${document.cookie}"`);

  // Find survey_data cookie manually (more reliable)
  const cookies = document.cookie.split(";").map(c => c.trim());
  const surveyCookie = cookies.find(c => c.startsWith("survey_data="));

  if (!surveyCookie) {
    console.log("❌ survey_data cookie NOT FOUND");
    return { raw: null, decoded: null, parsed: null };
  }

  const rawValue = surveyCookie.split("=")[1] || "";
  console.log("✅ Raw survey_data value (URL-encoded):", `"${rawValue}"`);

  let decoded: string | null = null;
  try {
    decoded = decodeURIComponent(rawValue);
    console.log("🔤 Decoded value:", `"${decoded}"`);
  } catch (e) {
    console.error("💥 decodeURIComponent failed:", e);
    return { raw: rawValue, decoded: null, parsed: null };
  }

  let parsed: SurveyData | null = null;
  try {
    parsed = JSON.parse(decoded) as SurveyData;
    console.log("📦 JSON.parse SUCCESS:", parsed);
  } catch (e) {
    console.error("💥 JSON.parse failed. Input was:", `"${decoded}"`, e);
  }

  return { raw: rawValue, decoded, parsed };
};

export default function Login() {
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  useEffect(() => {
    const logs: string[] = [];
    const { raw, decoded, parsed } = getSurveyCookieDebug();

    logs.push(`🔍 Cookie inspection started at ${new Date().toISOString()}`);
    logs.push(`✅ Raw value: ${raw ? `"${raw}"` : "null"}`);
    logs.push(`🔤 Decoded: ${decoded ? `"${decoded}"` : "null"}`);
    logs.push(`📦 Parsed: ${parsed ? JSON.stringify(parsed, null, 2) : "null"}`);

    if (parsed) {
      // Validate type
      if (["individual", "organization"].includes(parsed.type)) {
        const payload: SurveyData = {
          role: parsed.role || "",
          type: parsed.type as "individual" | "organization",
          confirm_tos: parsed.confirm_tos || false,
          first_name: parsed.type === "individual" ? parsed.first_name || "" : undefined,
          last_name: parsed.type === "individual" ? parsed.last_name || "" : undefined,
          phone_number: parsed.phone_number || "",
          email: parsed.email || "",
          contact_fullname: parsed.type === "organization" ? parsed.contact_fullname || "" : undefined,
          company_name: parsed.type === "organization" ? parsed.company_name || "" : undefined,
        };

        setSurveyData(payload);
        logs.push("✅ surveyData built successfully");
        // ⚠️ TEMP: DO NOT CLEAR COOKIE until confirmed working
        // clearDomainCookie("survey_data");
      } else {
        logs.push(`❌ Invalid type: "${parsed.type}"`);
      }
    } else {
      logs.push("❌ No valid survey data found");
    }

    setDebugLogs(logs);
    setIsLoading(false);
  }, []);

  const clearDomainCookie = (name: string) => {
    // 🔥 FIXED: Removed Domain= for local dev
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    console.log(`🧹 Cleared cookie "${name}"`);
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center min-h-screen">
        <CardView width="547px" height="500px" className="flex flex-col items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4" />
          <p className="text-gray-600">Loading survey data...</p>
        </CardView>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-start pt-6 min-h-screen bg-gray-950">
      <CardView width="547px" height="auto" className="p-6 text-white">
        <div className="flex justify-center mb-4">
          <Image src={infrafund} alt="InfraFund" width={160} height={40} />
        </div>

        <main className="space-y-4">
          {/* 🔬 Debug Panel */}
          <div className="bg-gray-800/50 p-4 rounded text-xs font-mono max-h-60 overflow-y-auto">
            <h3 className="text-cyan-400 font-bold mb-2">🔍 Debug Logs</h3>
            {debugLogs.map((log, i) => (
              <div key={i} className={log.includes("✅") ? "text-green-400" : log.includes("❌") ? "text-red-400" : "text-gray-300"}>
                {log}
              </div>
            ))}
          </div>

          {surveyData ? (
            <div className="mt-4">
              <h3 className="text-green-400 font-medium mb-2">✅ Data Ready — Starting Registration</h3>
              <PureParticleRegister
                surveyData={{
                  email: surveyData.email,
                  first_name: surveyData.first_name || "",
                  last_name: surveyData.last_name || "",
                  phone_number: surveyData.phone_number,
                  role: surveyData.role,
                  type: surveyData.type,
                  company_name: surveyData.company_name,
                }}
              />
            </div>
          ) : (
            <div className="text-center py-6 bg-red-900/20 rounded-lg">
              <p className="text-red-400 font-medium">❌ Survey data missing or invalid</p>
              <p className="text-sm text-gray-400 mt-2">
                Check console for details. Complete the survey and try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-gray-800 text-white rounded text-sm"
              >
                Retry
              </button>
            </div>
          )}
        </main>
      </CardView>
    </div>
  );
}