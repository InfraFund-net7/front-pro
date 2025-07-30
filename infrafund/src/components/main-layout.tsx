"use client";

import type React from "react";
import AppSidebar from "./sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex p-12 gap-12">
      <div className="h-fit">
        <AppSidebar />
      </div>

      <div className="flex-1">
        <div className="flex flex-col min-h-screen">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-6 sticky top-0 z-5">
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
