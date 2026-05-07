'use client';

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;
const gitSha = process.env.NEXT_PUBLIC_GIT_SHA;

export function BuildInfo({ className = '' }: { className?: string }) {
  if (!appVersion && !gitSha) {
    return null;
  }

  const parts = [appVersion ? `v${appVersion}` : null, gitSha ?? null].filter(
    Boolean
  );

  if (parts.length === 0) {
    return null;
  }

  return (
    <div className={`text-sm text-[#808080] ${className}`.trim()}>
      {parts.join(' · ')}
    </div>
  );
}
