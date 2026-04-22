'use client';
import { FormInput } from '@/components/ui/form-input';
import { Plus, X } from 'lucide-react';
import React, { useState } from 'react';
interface TeamMember {
  id: string;
  name: string;
  position: string;
  socialUrl: string;
  image?: File | null;
  imagePreview?: string;
}

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'John Hoffman',
      position: 'Ceo & Co-Founder',
      socialUrl: 'Social Url',
      imagePreview: '/placeholder.svg?height=60&width=60',
    },
    {
      id: '2',
      name: 'Jack Zareian',
      position: 'Product Designer',
      socialUrl: 'Social Url',
      imagePreview: '/placeholder.svg?height=60&width=60',
    },
  ]);

  const addMember = () => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: '',
      position: '',
      socialUrl: '',
      image: null,
    };
    setMembers([...members, newMember]);
  };

  const removeMember = (id: string) => {
    setMembers(members.filter((member) => member.id !== id));
  };

  const updateMember = (id: string, field: keyof TeamMember, value: string) => {
    setMembers(
      members.map((member) =>
        member.id === id ? { ...member, [field]: value } : member
      )
    );
  };

  return (
    <div className="w-full flex flex-col gap-14">
      <h1 className="text-white text-2xl font-semibold mb-8">Team Editor</h1>

      <div className="space-y-6">
        {members.map((member, index) => (
          <div
            key={member.id}
            className="rounded-lg p-6 border border-gray-700"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white text-lg font-medium">
                Team Member {index + 1}
              </h2>
              <X
                size={24}
                className="text-white cursor-pointer"
                onClick={() => removeMember(member.id)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* <FileUploadWithPreview onFileChange={() => {}} type="image" className="w-[458px] h-[58px]" /> */}
              <FormInput
                placeholder="Enter name"
                onChange={(e) =>
                  updateMember(member.id, 'name', e.target.value)
                }
                value={member.name}
                label="Name"
              />

              <FormInput
                placeholder="Enter position"
                onChange={(e) =>
                  updateMember(member.id, 'position', e.target.value)
                }
                value={member.position}
                label="Position"
              />
              <FormInput
                placeholder="Enter social URL"
                onChange={(e) =>
                  updateMember(member.id, 'socialUrl', e.target.value)
                }
                value={member.socialUrl}
                label="Social Url"
              />
            </div>
          </div>
        ))}

        <button
          onClick={addMember}
          className="flex items-center cursor-pointer space-x-2 text-primary hover:text-primary-300 transition-colors font-medium"
        >
          <Plus size={20} />
          <span>Add member</span>
        </button>
      </div>
    </div>
  );
}
