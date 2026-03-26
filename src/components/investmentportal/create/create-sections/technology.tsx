'use client';
import { FileUploadWithPreview } from '@/components/ui/file-upload-with-preview';
import { FormInput } from '@/components/ui/form-input';
import { Plus, Trash } from 'lucide-react';
import React, { useState } from 'react';

interface TechnologyData {
  id: string;
  itemTitle: string;
  itemDescription: string;
}

export function TechnologyForm() {
  const [technologies, setTechnologies] = useState<TechnologyData[]>([
    {
      id: '1',
      itemTitle: '',
      itemDescription: '',
    },
  ]);

  const [removingId, setRemovingId] = useState<string | null>(null);

  const addTechnology = () => {
    const lastId =
      technologies.length > 0
        ? parseInt(technologies[technologies.length - 1].id, 10)
        : 0;
    const newTechnology: TechnologyData = {
      id: (lastId + 1).toString(),
      itemTitle: '',
      itemDescription: '',
    };
    setTechnologies([...technologies, newTechnology]);
  };

  const removeTechnology = (id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      setTechnologies((prev) =>
        prev.filter((technology) => technology.id !== id)
      );
      setRemovingId(null);
    }, 300);
  };

  const updateTechnology = (
    id: string,
    field: keyof TechnologyData,
    value: string
  ) => {
    setTechnologies(
      technologies.map((technology) =>
        technology.id === id ? { ...technology, [field]: value } : technology
      )
    );
  };

  return (
    <div className="w-full space-y-6">
      {technologies.map((technology, index) => (
        <div
          key={technology.id}
          className={`w-full relative rounded-2xl border border-border-card p-6 transition-all duration-300 ease-in-out
          ${
            removingId === technology.id ? 'animate-fadeOut' : 'animate-fadeIn'
          }`}
          style={{
            animationDelay: `${index * 0.05}s`,
          }}
        >
          <div className="flex items-center justify-between mb-8 absolute top-3 right-4">
            <button
              onClick={() => removeTechnology(technology.id)}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <Trash size={24} />
            </button>
          </div>

          <TechnologyFormSection
            technology={technology}
            onUpdate={updateTechnology}
          />
        </div>
      ))}

      <button
        onClick={addTechnology}
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

interface TechnologyFormSectionProps {
  technology: TechnologyData;
  onUpdate: (id: string, field: keyof TechnologyData, value: string) => void;
}

function TechnologyFormSection({
  technology,
  onUpdate,
}: TechnologyFormSectionProps) {
  return (
    <div className="flex flex-col gap-6 w-full">
      <FormInput
        label={`Item ${technology.id} title`}
        value={technology.itemTitle}
        placeholder={`Item ${technology.id} title`}
        onChange={(e) => onUpdate(technology.id, 'itemTitle', e.target.value)}
      />
      <FormInput
        label={`Item ${technology.id} description`}
        value={technology.itemDescription}
        placeholder={`Item ${technology.id} description`}
        onChange={(e) =>
          onUpdate(technology.id, 'itemDescription', e.target.value)
        }
      />
      <div className="w-full flex flex-col gap-3">
        <span className="text-sm font-normal">{`Item ${technology.id}  icon`}</span>
        <FileUploadWithPreview type="image" onFileChange={() => null} />
      </div>
    </div>
  );
}

export default function Technologies() {
  return (
    <div className="flex flex-col w-full gap-6">
      <span className="text-3xl text-white font-normal">Technologies</span>
      <FormInput
        label="Main Technology"
        placeholder="Main Technology"
        className="w-full"
      />
      <FormInput
        label="Main Technology description"
        placeholder="Main Technology description"
        className="w-full"
      />
      <TechnologyForm />
    </div>
  );
}
