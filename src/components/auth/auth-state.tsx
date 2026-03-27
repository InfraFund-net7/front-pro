'use client';

import { CustomButton } from '@/components/ui/custom-button';

export function AuthLoadingState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[320px] w-full max-w-md flex-col items-center justify-center gap-4 rounded-3xl border border-[#263247] bg-[#111827]/70 px-8 py-10 text-center text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#263247] border-t-primary" />
      <p className="text-sm text-[#C7CAD5]">{message}</p>
    </div>
  );
}

export function AuthErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[320px] w-full max-w-md flex-col items-center justify-center gap-5 rounded-3xl border border-[#3B1F24] bg-[#1A1113]/80 px-8 py-10 text-center text-white">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Session setup failed</h2>
        <p className="text-sm text-[#C7CAD5]">{message}</p>
      </div>
      <CustomButton variant="filled" className="w-fit px-5" onClick={onRetry}>
        Retry
      </CustomButton>
    </div>
  );
}
