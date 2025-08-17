"use client";
import type React from "react";
import AppSidebar from "./sidebar";
import Header from "./header";
import { usePathname } from "next/navigation";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0C0C0D]">
      {/* Background circles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 opacity-50 w-[662px] h-[662px] rounded-full blur-3xl bg-[#1A2A4AAD]" />
        <div className="absolute -bottom-44 -left-32 opacity-50 w-[662px] h-[662px] rounded-full blur-3xl bg-[#1A2A4AAD]" />
      </div>

      {/* Main content */}
      {isAuthPage ? (
        <div className="relative z-[999] flex items-center justify-center min-h-screen p-4">
          {children}
        </div>
      ) : (
        <div className="relative z-[999] flex p-4 md:p-8 lg:p-12 gap-4 md:gap-8 lg:gap-12 min-h-screen">
          <div className="h-full -mt-3.5">
            <AppSidebar />
          </div>
          <div className="flex-1">
            <div className="flex flex-col h-fit px-12 gap-12">
              <Header />
              <main className="flex-1 backdrop-blur-sm rounded-lg">
                {children}
              </main>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
