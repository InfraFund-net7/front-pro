"use client";
import { FileUploadWithPreview } from "@/components/ui/file-upload-with-preview";
import { FormInput } from "@/components/ui/form-input";
import { Plus, Trash } from "lucide-react";
import React, { useState } from "react";

interface HighlightData {
  id: string;
  itemTitle: string;
  itemDescription: string;
}

export function HighlightForm() {
  const [highlights, setHighlights] = useState<HighlightData[]>([
    {
      id: "1",
      itemTitle: "",
      itemDescription: "",
    },
  ]);

  const [removingId, setRemovingId] = useState<string | null>(null);

  const addHighlight = () => {
    const lastId =
      highlights.length > 0
        ? parseInt(highlights[highlights.length - 1].id, 10)
        : 0;
    const newHighlight: HighlightData = {
      id: (lastId + 1).toString(),
      itemTitle: "",
      itemDescription: "",
    };
    setHighlights([...highlights, newHighlight]);
  };

  const removeHighlight = (id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      setHighlights((prev) => prev.filter((highlight) => highlight.id !== id));
      setRemovingId(null);
    }, 300);
  };

  const updateHighlight = (
    id: string,
    field: keyof HighlightData,
    value: string
  ) => {
    setHighlights(
      highlights.map((highlight) =>
        highlight.id === id ? { ...highlight, [field]: value } : highlight
      )
    );
  };

  return (
    <div className="w-full space-y-6">
      {highlights.map((highlight, index) => (
        <div
          key={highlight.id}
          className={`w-full relative rounded-2xl border border-border-card p-6 transition-all duration-300 ease-in-out
          ${
            removingId === highlight.id ? "animate-fadeOut" : "animate-fadeIn"
          }`}
          style={{
            animationDelay: `${index * 0.05}s`,
          }}
        >
          <div className="flex items-center justify-between mb-8 absolute top-3 right-4">
            <button
              onClick={() => removeHighlight(highlight.id)}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <Trash size={24} />
            </button>
          </div>

          <HighlightFormSection
            highlight={highlight}
            onUpdate={updateHighlight}
          />
        </div>
      ))}

      <button
        onClick={addHighlight}
        className="flex items-center gap-2 mt-4 text-green-400 hover:text-green-300 transition-colors duration-200 group"
      >
        <Plus size={20} />
        <span className="font-medium">Add one more</span>
      </button>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-fadeOut {
          animation: fadeOut 0.3s ease-in forwards;
        }
      `}</style>
    </div>
  );
}

interface HighlightFormSectionProps {
  highlight: HighlightData;
  onUpdate: (id: string, field: keyof HighlightData, value: string) => void;
}

function HighlightFormSection({
  highlight,
  onUpdate,
}: HighlightFormSectionProps) {
  return (
    <div className="flex flex-col gap-6 w-full">
      <FormInput
        label={`Item ${highlight.id} title`}
        value={highlight.itemTitle}
        placeholder={`Item ${highlight.id} title`}
        onChange={(e) => onUpdate(highlight.id, "itemTitle", e.target.value)}
      />
      <FormInput
        label={`Item ${highlight.id} description`}
        value={highlight.itemDescription}
        placeholder={`Item ${highlight.id} description`}
        onChange={(e) =>
          onUpdate(highlight.id, "itemDescription", e.target.value)
        }
      />
      <div className="w-full flex flex-col gap-3">
        <span className="text-sm font-normal">{`Item ${highlight.id}  icon`}</span>
        <FileUploadWithPreview type="image" onFileChange={() => null} />
      </div>
    </div>
  );
}

export default function Highlights() {
  return (
    <div className="flex flex-col w-full gap-6">
      <span className="text-3xl text-white font-normal">Highlights</span>
      <FormInput
        label="Main heading"
        placeholder="Main heading"
        className="w-full"
      />
      <FormInput
        label="Main heading description"
        placeholder="Main heading description"
        className="w-full"
      />
      <HighlightForm />
    </div>
  );
}
