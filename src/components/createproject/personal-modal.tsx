import { CustomButton } from '@/components/ui/custom-button';
import { FormInput } from '@/components/ui/form-input';
import { Modal } from '@/components/ui/modal';
import { ArrowLeft } from 'lucide-react';
import React from 'react';
interface PersonalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}
export default function PersonalModal({
  isOpen,
  onClose,
  onContinue,
}: PersonalModalProps) {
  const Inputs = [
    {
      label: 'First Name',
      placeholder: 'First Name',
    },
    {
      label: 'Last Name',
      placeholder: 'Last Name',
    },
    {
      label: 'Email',
      placeholder: 'Email',
    },
    {
      label: 'Title',
      placeholder: 'Title',
    },
    {
      label: 'Phone Number(optional)',
      placeholder: 'Phone Number',
    },
  ];
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      height="700px"
      width="788px"
      ModalTitle="Application Form"
    >
      <span className="text-base text-[#C7CAD5] font-normal">
        Complete your information to stay connected and receive updates.
      </span>
      <div className="w-fit h-fit gap-6 flex flex-col">
        <span className="text-3xl text-white">Contact information</span>
        <div className="grid grid-cols-2 gap-6">
          {Inputs.map((item, index) => (
            <div className="w-[302px]" key={index}>
              <FormInput label={item.label} placeholder={item.placeholder} />
            </div>
          ))}
        </div>
      </div>

      <div className="w-full h-fit flex justify-between items-center">
        <CustomButton
          variant="canceled"
          className="w-32 h-11 flex justify-center items-center gap-2 bg-[#1C2332]"
        >
          <ArrowLeft size={24} />
          Back
        </CustomButton>
        <CustomButton
          variant="filled"
          className="w-32 h-11 flex justify-center items-center"
          onClick={onContinue}
        >
          Continue
        </CustomButton>
      </div>
    </Modal>
  );
}
