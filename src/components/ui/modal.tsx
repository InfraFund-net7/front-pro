// src/components/Modal.tsx
"use client";

import { X } from "lucide-react";
import type React from "react";
import { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
  height?: string;
  ModalTitle?: string;
  className?: string;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  ModalTitle,
  width = "42rem",
  height = "auto",
  className = "",
  showCloseButton = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // ❗ فیکس اصلی: فقط وقتی isOpen=false باشه، پنهان بشه
  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#090B1166] backdrop-blur-sm p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        style={{
          width,
          maxWidth: "512px",
          height,
        }}
        className={`relative p-3 sm:p-4 md:p-5 flex flex-col items-start rounded-[20px] shadow-2xl bg-[#343C5266] backdrop-blur-xl border border-card-bg-border ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex justify-between items-center mb-2 sm:mb-3">
          {ModalTitle && (
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {ModalTitle}
            </h2>
          )}
          {showCloseButton && (
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="cursor-pointer text-white hover:text-[#24FF8E] transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}