"use client";

import type React from "react";

import { useState, useRef, useCallback } from "react";
import { Upload } from "lucide-react";

interface FileUploadProps {
  type: "image" | "pdf";
  onFileSelect: (file: File) => void;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  type,
  onFileSelect,
  className = "",
  disabled = false,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = {
    image: {
      text: "Drag your image or",
      browseText: "Browse",
      maxSize: "4MB Max",
      accept: "image/*",
      maxSizeBytes: 4 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    },
    pdf: {
      text: "Drag your document or",
      browseText: "Browse",
      maxSize: ".PDF",
      accept: ".pdf",
      maxSizeBytes: 10 * 1024 * 1024,
      allowedTypes: ["application/pdf"],
    },
  };

  const currentConfig = config[type];

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!currentConfig.allowedTypes.includes(file.type)) {
        return type === "image"
          ? "Please select a valid image file"
          : "Please select a valid PDF file";
      }

      if (file.size > currentConfig.maxSizeBytes) {
        const maxSizeMB = currentConfig.maxSizeBytes / (1024 * 1024);
        return `File size must be less than ${maxSizeMB}MB`;
      }

      return null;
    },
    [currentConfig, type]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      onFileSelect(file);
    },
    [validateFile, onFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [disabled, handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleBrowseClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={`w-full ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg h-[56px] flex justify-center items-center text-center transition-all duration-300 ease-in-out
          ${
            isDragOver
              ? "border-primary-300 bg-green-400/10"
              : "border-[#48546A] bg-[#131C2F]"
          }
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:border-primary-hover hover:bg-green-400/5"
          }
        `}
        onClick={handleBrowseClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={currentConfig.accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex items-center gap-4">
          <Upload className="w-8 h-8 text-primary" />

          <div className="text-gray-300">
            <span>{currentConfig.text} </span>
            <button
              type="button"
              className="text-primary-300 hover:bg-primary-hover transition-colors duration-200 font-medium"
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseClick();
              }}
            >
              {currentConfig.browseText}
            </button>
            <span className="ml-1">{currentConfig.maxSize}</span>
          </div>
        </div>
      </div>

      {error && <div className="mt-2 text-error text-sm">{error}</div>}
    </div>
  );
}
