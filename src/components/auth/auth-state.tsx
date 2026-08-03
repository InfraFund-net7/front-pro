'use client';

export function AuthLoadingState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[320px] w-full max-w-md flex-col items-center justify-center gap-4 rounded-3xl border border-[#263247] bg-[#111827]/70 px-8 py-10 text-center text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#263247] border-t-primary" />
      <p className="text-sm text-[#C7CAD5]">{message}</p>
    </div>
  );
}
