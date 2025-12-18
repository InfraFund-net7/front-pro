import type React from "react";
import { MainLayout } from "@/components/main-layout";
import "./globals.css";
import { ParticleConnectProvider } from "@/lib/particle-config";

export default function RootLayout({
  children,
}: {
  children: React.Reahttps://github.com/InfraFund-net7/front-pro/pull/11/conflict?name=src%252Fapp%252Flayout.tsx&base_oid=6487392c7742f5f306c80f3e3f1d2facb56ad837&head_oid=e708de1b93168dbffec9b948a85bac1d0fd6d05fctNode;
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
