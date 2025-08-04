"use client";

import { useState, useRef, type ChangeEvent } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

interface ImageUploadProps {
  text: string;
  width: number;
  height: number;
}

export default function BoxUpload({ text, width, height }: ImageUploadProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center rounded-lg bg-[#131C2F] border-2 border-dashed border-[#48546A] bg-dark-bg text-white cursor-pointer p-4"
      style={{ width: `${width}px`, height: `${height}px` }}
      onClick={handleAreaClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      {uploadedImage ? (
        <Image
          src={uploadedImage || "/placeholder.svg"}
          alt="Uploaded image"
          fill
          style={{ objectFit: "contain" }}
        />
      ) : (
        <>
          <ImageIcon className="w-12 h-12 mb-2" />
          <span className="text-lg font-medium">{text}</span>
        </>
      )}
    </div>
  );
}
