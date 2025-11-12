"use client";

import { useAtom } from "jotai";
import { useEffect } from "react";

export function usePersistentAtom<T>(atom: any, key: string) {
  const [value, setValue] = useAtom(atom);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) setValue(JSON.parse(stored));
  }, [key, setValue]);

  useEffect(() => {
    if (value !== null && value !== undefined) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.removeItem(key);
    }
  }, [key, value]);

  return [value, setValue] as const;
}
