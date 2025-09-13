import type React from "react";
import { MainLayout } from "@/components/main-layout";
import "./globals.css";
import { headers } from 'next/headers';
import ContextProvider from "@/context";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const cookies = headersList.get("cookie");

  return (
    <html lang="en">
      <body>
        <ContextProvider cookies={cookies}>
          <MainLayout>{children}</MainLayout>
        </ContextProvider>
      </body>
    </html>
  );
}