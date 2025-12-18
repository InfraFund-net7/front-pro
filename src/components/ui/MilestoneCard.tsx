import { useState } from "react";
import { FormInput } from "./form-input";

export default function MilestoneCard() {
  const [milestones, setMilestones] = useState([
    { id: 1, name: "", cost: "", endDate: "" },
  ]);

  const addMilestone = () => {
    const newId = milestones.length + 1;
    setMilestones([
      ...milestones,
      { id: newId, name: "", cost: "", endDate: "" },
    ]);
  };

  const updateMilestone = (id: number, field: string, value: string) => {
    setMilestones(
      milestones.map((milestone) =>
        milestone.id === id ? { ...milestone, [field]: value } : milestone
      )
    );
  };

  return (
    <div className="space-y-4">
      {milestones.map((milestone) => (
        <div
          key={milestone.id}
          className="border-[#424242] border w-full flex flex-col gap-6 rounded-[20px] p-4"
        >
          <h2 className="text-white text-lg font-medium">
            Milestone {milestone.id}
          </h2>

          <div className="grid grid-cols-3 gap-6">
            <FormInput label="Name" placeholder="Name" />
            <FormInput label="Cost" placeholder="Cost" />
            <FormInput label="End Date" placeholder="End Date" />
          </div>
        </div>
      ))}

      <button
        onClick={addMilestone}
        className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
      >
        <span className="text-xl">+</span>
        <span>Add milestone</span>
      </button>
    </div>
  );
}
