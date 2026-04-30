import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import { MainLayout } from '@/components/main-layout';
import { AppProviders } from '@/lib/openfort-config';
import './globals.css';

export const metadata: Metadata = {
  // Openfort's embedded wallet iframe (https://embed.openfort.io/iframe/{pk})
  // 403s when the request has no Referer it can match against the project's
  // allowed origins. See docs-dev/tasks/task-101-fix-openfort-registration.md.
  referrer: 'origin',
};

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
