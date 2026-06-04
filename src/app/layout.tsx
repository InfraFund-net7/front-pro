import type { ReactNode } from 'react';
import { MainLayout } from '@/components/main-layout';
import './globals.css';
import { OpenfortAppProvider } from '@/providers/openfort-app-provider';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OpenfortAppProvider>
          <MainLayout>{children}</MainLayout>
        </OpenfortAppProvider>
      </body>
    </html>
  );
}
