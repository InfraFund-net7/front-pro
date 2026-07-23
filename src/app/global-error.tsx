'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { CustomButton } from '@/components/ui/custom-button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { area: 'unknown', stage: 'global-error' },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0C0C0D] text-white antialiased">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border border-[#3B1F24] bg-[#1A1113]/80 px-8 py-10 text-center">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Something went wrong</h2>
              <p className="text-sm text-[#C7CAD5]">
                An unexpected error occurred. Our team has been notified.
              </p>
            </div>
            <CustomButton
              variant="filled"
              className="w-fit px-5"
              onClick={() => reset()}
            >
              Try again
            </CustomButton>
          </div>
        </div>
      </body>
    </html>
  );
}
