import { FormInput } from '@/components/ui/form-input';
import MilestoneCard from '@/components/ui/MilestoneCard';

const formFields = [
  { label: 'Token Name', placeholder: 'Token Name' },
  { label: 'Digital Asset Symbol', placeholder: 'e.g. $INF' },
  { label: 'Digital Asset Supply', placeholder: 'Total supply' },
  { label: 'Price', placeholder: 'Price' },
  { label: 'Min Raise', placeholder: 'Min Raise' },
  { label: 'Max Raise', placeholder: 'Max Raise' },
  { label: 'Min Donation', placeholder: 'Min Donation' },
  { label: 'Max Donation', placeholder: 'Max Donation' },
  { label: 'Start Date', placeholder: 'Start Date' },
  { label: 'End Date', placeholder: 'End Date' },
];

const extraFields = [
  {
    label: 'General Contractor (GC) Wallet Address',
    placeholder: 'Wallet Address',
  },
  { label: 'Pledge Address', placeholder: 'Pledge Address' },
];

interface CrowdfundingDetailsProps {
  title: string;
}

export default function CrowdfundingDetails({
  title,
}: CrowdfundingDetailsProps) {
  return (
    <div className="flex flex-col gap-6">
      <span className="text-3xl font-normal text-white">{title}</span>

      <div className="grid grid-cols-2 gap-6 w-full">
        {formFields.map((field) => (
          <FormInput
            key={field.label}
            label={field.label}
            placeholder={field.placeholder}
            className="w-full"
          />
        ))}
      </div>

      <MilestoneCard />

      {extraFields.map((field) => (
        <FormInput
          key={field.label}
          label={field.label}
          placeholder={field.placeholder}
          className="w-full"
        />
      ))}
    </div>
  );
}
