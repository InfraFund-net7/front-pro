import { CustomButton } from '@/components/ui/custom-button';
import { FormInput } from '@/components/ui/form-input';
import { Eye, Plus } from 'lucide-react';
import React from 'react';

export default function PressSection() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <span className="text-3xl text-white font-normal">
        Add Press (max. 12)
      </span>
      <div className="flex flex-col gap-3">
        <span className="text-sm text-white font-semibold">
          Image gallery (max. 10)
        </span>
        <div className="px-4 py-6 flex flex-col gap-6 border border-border-card rounded-3xl w-full">
          <div className="flex flex-col gap-2 w-fit">
            <div className="flex gap-6 justify-start items-center w-[250px]">
              <span className="text-sm text-white font-normal">Article 1</span>
              <div className="w-3.5 h-1 bg-white rounded-3xl" />
            </div>
            <FormInput placeholder="URL" className="w-[250px]" />
            <CustomButton
              variant="filled"
              className="flex justify-center items-center gap-2 w-[135px]"
            >
              <Eye width={20} height={20} />
              <span className="text-sm text-black font-semibold">Preview</span>
            </CustomButton>
          </div>
          {/* <div key={item.title}>
                          <span className="text-sm text-white font-semibold">
                            {item.title}
                          </span>
                          <FileUploadWithPreview
                            type="image"
                            onFileChange={(file) => handleFileChange(item.title, file)}
                            className="w-[458px]"
                          />
                        </div> */}
          <div className="h-fit flex justify-start items-center">
            <button
              // onClick={addGalleryImage}
              className="flex items-center gap-2 mt-4 text-green-400 hover:text-green-300 transition-colors duration-200 group"
            >
              <Plus size={20} />
              <span className="font-medium">Add one more</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
