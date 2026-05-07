'use client';

import { useState } from 'react';

export function useCopyToClipboard(resetMs = 1500) {
  const [justCopied, setJustCopied] = useState(false);

  const copy = async (value: string | undefined | null) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setJustCopied(true);
      window.setTimeout(() => setJustCopied(false), resetMs);
    } catch {
      // Clipboard API can fail in non-secure contexts; ignore silently.
    }
  };

  return { justCopied, copy };
}
