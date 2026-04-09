import type { ReactNode } from 'react';
import { MainLayout } from '@/components/main-layout';
import './globals.css';
import { ParticleConnectProvider } from '@/lib/particle-config';
import { ParticleVerificationProvider } from '@/providers/particle-verification-provider';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ParticleConnectProvider>
          <ParticleVerificationProvider>
            <MainLayout>{children}</MainLayout>
          </ParticleVerificationProvider>
        </ParticleConnectProvider>
      </body>
    </html>
  );
}
