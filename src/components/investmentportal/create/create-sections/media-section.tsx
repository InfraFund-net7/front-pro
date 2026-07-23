'use client';
import React, { useCallback, useState } from 'react';
import { FileUploadWithPreview } from '@/components/ui/file-upload-with-preview';
import { Plus } from 'lucide-react';

type MediaProps = {
  onAnyFileChange?: (title: string, file: File | null) => void;
};

type MediaItem = {
  title: string;
  file: File | null;
};

export default function MediaSection({ onAnyFileChange }: MediaProps) {
  const [uploads, setUploads] = useState<MediaItem[]>([
    { title: 'Brand logotype light mode', file: null },
    { title: 'Brand logotype dark mode', file: null },
    { title: 'Favicon', file: null },
    { title: 'Hero section image', file: null },
    { title: 'Mobile logotype', file: null },
    { title: 'Upload your Whitepaper', file: null },
  ]);

  // Partners state
  const [partners, setPartners] = useState<MediaItem[]>([
    { title: 'Partner 1', file: null },
  ]);

  // Image Gallery state
  const [gallery, setGallery] = useState<MediaItem[]>([
    { title: 'Image 1', file: null },
  ]);

  const handleFileChange = useCallback(
    (title: string, file: File | null) => {
      // update uploads
      setUploads((prev) =>
        prev.map((item) => (item.title === title ? { ...item, file } : item))
      );

      // update partners
      setPartners((prev) =>
        prev.map((item) => (item.title === title ? { ...item, file } : item))
      );

      // update gallery
      setGallery((prev) =>
        prev.map((item) => (item.title === title ? { ...item, file } : item))
      );

      if (onAnyFileChange) {
        onAnyFileChange(title, file);
      }
    },
    [onAnyFileChange]
  );

  // Add new Partner
  const addPartner = () => {
    const newIndex = partners.length + 1;
    setPartners([...partners, { title: `Partner ${newIndex}`, file: null }]);
  };

  // Add new Gallery Image (max 10)
  const addGalleryImage = () => {
    if (gallery.length >= 10) return;
    const newIndex = gallery.length + 1;
    setGallery([...gallery, { title: `Image ${newIndex}`, file: null }]);
  };

  return (
    <div className="flex flex-col gap-6 w-full h-fit">
      <span className="text-3xl font-normal text-white">Edit Media Files</span>

      {/* Default uploads */}
      <div className="grid grid-cols-2 gap-6 w-full border border-border-card p-4 rounded-[20px]">
        {uploads.map((item) => (
          <div className="flex flex-col gap-3" key={item.title}>
            <span className="text-sm text-white font-semibold">
              {item.title}
            </span>
            <FileUploadWithPreview
              type="image"
              onFileChange={(file) => handleFileChange(item.title, file)}
              className="w-full max-w-[458px]"
            />
          </div>
        ))}
      </div>

      {/* Partners + Gallery */}
      <div className="w-full h-fit flex justify-between items-start gap-6">
        {/* Partners */}
        <div className="w-fit h-fit flex flex-col gap-6">
          <div className="px-4 py-6 flex flex-col justify-center items-center gap-6 border border-border-card rounded-3xl">
            {partners.map((item) => (
              <div className="flex flex-col gap-3" key={item.title}>
                <span className="text-sm text-white font-semibold">
                  {item.title}
                </span>
                <FileUploadWithPreview
                  type="image"
                  onFileChange={(file) => handleFileChange(item.title, file)}
                  className="w-[458px]"
                />
              </div>
            ))}
            <div className="w-full h-fit flex justify-center items-center">
              <button
                onClick={addPartner}
                className="flex items-center gap-2 mt-4 text-green-400 hover:text-green-300 transition-colors duration-200 group"
              >
                <Plus size={20} />
                <span className="font-medium">Add one more</span>
              </button>
            </div>
          </div>
        </div>

        {/* Image Sections */}
        <div className="flex flex-col justify-center items-center gap-6">
          {/* Whitepaper section */}
          <div className="flex flex-col gap-3">
            <span className="text-sm text-white font-semibold">
              Image sections
            </span>
            <div className="px-4 py-6 flex flex-col gap-6 border border-border-card rounded-3xl">
              <span className="text-sm text-white font-semibold">
                Whitepaper section image
              </span>
              <FileUploadWithPreview
                type="image"
                onFileChange={(file) =>
                  handleFileChange('Whitepaper section image', file)
                }
                className="w-[458px]"
              />
            </div>
          </div>

          {/* Gallery */}
          <div className="flex flex-col gap-3">
            <span className="text-sm text-white font-semibold">
              Image gallery (max. 10)
            </span>
            <div className="px-4 py-6 flex flex-col gap-6 border border-border-card rounded-3xl">
              {gallery.map((item) => (
                <div key={item.title}>
                  <span className="text-sm text-white font-semibold">
                    {item.title}
                  </span>
                  <FileUploadWithPreview
                    type="image"
                    onFileChange={(file) => handleFileChange(item.title, file)}
                    className="w-[458px]"
                  />
                </div>
              ))}
              {gallery.length < 10 && (
                <div className="w-full h-fit flex justify-center items-center">
                  <button
                    onClick={addGalleryImage}
                    className="flex items-center gap-2 mt-4 text-green-400 hover:text-green-300 transition-colors duration-200 group"
                  >
                    <Plus size={20} />
                    <span className="font-medium">Add one more</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
