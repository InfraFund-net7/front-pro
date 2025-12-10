"use client";

import { useState } from "react";
import { X, FileText, ImageIcon } from "lucide-react";
import { FileUpload } from "./file-upload";
import Image from "next/image";

interface FileUploadWithPreviewProps {
  type: "image" | "pdf";
  onFileChange: (file: File | null) => void;
  className?: string;
}

export function FileUploadWithPreview({
  type,
  onFileChange,
  className = "",
}: FileUploadWithPreviewProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    onFileChange(file);

    if (type === "image") {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onFileChange(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  return (
    <div className={className}>
      {!selectedFile ? (
        <FileUpload type={type} onFileSelect={handleFileSelect} />
      ) : (
        <div className="border-2 border-dashed border-primary-300 rounded-lg p-6">
          <div className="flex items-start gap-4">
            {type === "image" && previewUrl ? (
              <Image
                src={previewUrl || "/placeholder.svg"}
                alt="Preview"
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                {type === "image" ? (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                ) : (
                  <FileText className="w-8 h-8 text-error" />
                )}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {selectedFile.name}
              </p>
              <p className="text-gray-400 text-sm">
                {formatFileSize(selectedFile.size)}
              </p>
              <p className="text-success text-sm">
                File uploaded successfully
              </p>
            </div>

            <button
              onClick={handleRemoveFile}
              className="text-gray-400 hover:text-error transition-colors duration-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
