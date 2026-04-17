import type { ReactNode } from 'react';
import Script from 'next/script';
import { MainLayout } from '@/components/main-layout';
import { AppProviders } from '@/lib/openfort-config';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const htmlClassName =
    process.env.NODE_ENV === 'production' ? 'hide-feedback-widget' : undefined;

  return (
    <html lang="en" className={htmlClassName}>
      <body>
        {recaptchaSiteKey ? (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`}
            strategy="afterInteractive"
          />
        ) : null}
        <AppProviders>
          <MainLayout>{children}</MainLayout>
        </AppProviders>
      </body>
    </html>
  );
}
