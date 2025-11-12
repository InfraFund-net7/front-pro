"use client";
import { atom } from "jotai";

export const userRoleAtom = atom<string | null>(null);
export const userTypeAtom = atom<"individual" | "business" | null>(null);
