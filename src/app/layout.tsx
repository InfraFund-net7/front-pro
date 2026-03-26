import type { ReactNode } from 'react';
import { MainLayout } from '@/components/main-layout';
import { AppProviders } from '@/lib/openfort-config';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <MainLayout>{children}</MainLayout>
        </AppProviders>
      </body>
    </html>
  );
}
