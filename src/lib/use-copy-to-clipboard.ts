'use client';

import { useEffect, useRef, useState } from 'react';

export function useCopyToClipboard(resetMs = 1500) {
  const [justCopied, setJustCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  const copy = async (value: string | undefined | null) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setJustCopied(true);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setJustCopied(false);
        timeoutRef.current = null;
      }, resetMs);
    } catch {
      // Clipboard API can fail in non-secure contexts; ignore silently.
    }
  };

  return { justCopied, copy };
}
