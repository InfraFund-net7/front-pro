"use client";

import { X } from "lucide-react";
import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
  height?: string;
  ModalTitle?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  ModalTitle,
  width = "32rem",
  height = "auto",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#090B1166] backdrop-blur-sm animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      <div
        style={{ width, height }}
        className="relative p-12 flex flex-col justify-evenly items-start rounded-[40px] shadow-lg bg-[#343C5266] backdrop-blur-xl border border-card-bg-border animate-slide-in"
      >
        <div className="w-full h-fit flex justify-between items-center hover:text-white transition-colors">
          <h2 className="text-2xl font-bold text-white">{ModalTitle}</h2>
          <button onClick={onClose} aria-label="Close modal" className="cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
