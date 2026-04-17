'use client';

import { X } from 'lucide-react';
import { CustomButton } from './custom-button';
import { useState } from 'react';

export function ErrorBanner({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-[#3B1F24] bg-[#1A1113]/90 px-4 py-3 text-white shadow-lg backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm text-[#C7CAD5]">{message}</p>
        </div>
        <div className="flex items-center gap-2">
          {onRetry ? (
            <CustomButton
              variant="filled"
              className="h-9 px-4"
              onClick={onRetry}
            >
              Retry
            </CustomButton>
          ) : null}
          <button
            type="button"
            className="rounded-md p-2 text-[#C7CAD5] hover:text-white"
            aria-label="Dismiss error"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
