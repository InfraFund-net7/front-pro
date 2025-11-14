import type React from "react";
import { MainLayout } from "@/components/main-layout";
import "./globals.css";
import { ParticleConnectProvider } from "@/lib/particle-config";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ParticleConnectProvider>
          <MainLayout>{children}</MainLayout>
        </ParticleConnectProvider>
      </body>
    </html>
  );
}
