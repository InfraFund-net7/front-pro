"use client";

import { Bell, Headset, Wallet } from "lucide-react";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { CustomButton } from "./ui/custom-button";
import { ConnectWallet } from "./connectwallet/connect-wallet-modal";
import { useAppKitAccount, useAppKitConnections } from "@reown/appkit/react";

const shortenAddress = (address: string | undefined) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/kyc": "KYC",
  "/explore-projects": "Explore Projects",
  "/projects": "Projects",
  "/settings": "Settings",
};

export default function Header() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pageTitle = routeTitles[pathname] || "Page";

  const { address, isConnected } = useAppKitAccount();
  const { connections } = useAppKitConnections();
  const userIdentifier =
    isConnected && address ? shortenAddress(address).slice(0, 6) : "Guest";

  return (
    <div className="flex h-16 shrink-0 justify-between items-center sticky top-0 z-20 rounded-lg mb-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-normal text-white leading-2">
          Hi {userIdentifier}
          <span className="text-[#8087A3] text-base font-normal">
            {" "}
            - {isConnected ? "Connected" : "Guest"}
          </span>
        </span>
        <span className="text-[40px] font-bold text-white">{pageTitle}</span>
      </div>

      <div className="flex justify-center items-center gap-4">
        <Headset size={24} className="text-white cursor-pointer" />
        <Bell size={24} className="text-white cursor-pointer" />
        {isConnected ? (
          <div className="w-fit h-[40px] flex justify-center items-center gap-2 text-primary">
            <Wallet size={24} />
            <span className="text-sm font-semibold">
              {shortenAddress(address)}
            </span>
          </div>
        ) : (
          <CustomButton
            variant="outlined"
            className="w-fit h-[40px] flex justify-center items-center gap-2 text-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Wallet size={24} />
            <span className="text-sm font-semibold">Connect Wallet</span>
          </CustomButton>
        )}
        <div className="w-12 h-12 rounded-full bg-[#263247] flex justify-center items-center text-white">
          {/* {connections.find((x) => x.icon)} */}
        </div>
      </div>
      <ConnectWallet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
