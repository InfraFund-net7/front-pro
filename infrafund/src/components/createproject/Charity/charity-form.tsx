import { CustomButton } from "@/components/ui/custom-button";
import { Dropdown } from "@/components/ui/dropdown";
import { FileUploadWithPreview } from "@/components/ui/file-upload-with-preview";
import { FormInput } from "@/components/ui/form-input";
import { ArrowLeft } from "lucide-react";
import React from "react";

const infrastructureTypes = [
  { key: "wind", value: "wind-energy", label: "Wind Energy" },
  { key: "solar", value: "solar-power", label: "Solar Power" },
  { key: "hydro", value: "hydroelectric", label: "Hydroelectric" },
  { key: "nuclear", value: "nuclear", label: "Nuclear" },
  { key: "geo", value: "geothermal", label: "Geothermal" },
];

const projectStatuses = [
  { key: "ready", value: "ready-to-launch", label: "Ready to launch" },
  { key: "dev", value: "in-development", label: "In Development" },
  { key: "plan", value: "planning", label: "Planning" },
  { key: "hold", value: "on-hold", label: "On Hold" },
  { key: "done", value: "completed", label: "Completed" },
];

const raisedOptions = [
  { key: "yes", value: "yes", label: "Yes" },
  { key: "no", value: "no", label: "No" },
];

export default function CharityForm() {
  const [infrastructureType, setInfrastructureType] =
    React.useState("wind-energy");
  const [projectStatus, setProjectStatus] = React.useState("ready-to-launch");
  const [raisedBefore, setRaisedBefore] = React.useState("no");

  const handleInfrastructureChange = (value: string, key: string) => {
    setInfrastructureType(value);
    console.log("Infrastructure changed:", { value, key });
  };

  const handleProjectStatusChange = (value: string, key: string) => {
    setProjectStatus(value);
    console.log("Project status changed:", { value, key });
  };

  const handleRaisedBeforeChange = (value: string, key: string) => {
    setRaisedBefore(value);
    console.log("Raised before changed:", { value, key });
  };
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <span className="text-4xl font-semibold text-white">
          Application Form
        </span>
        <span className="text-base font-normal text-[#C7CAD5]">
          Complete your information to stay connected and receive updates.
        </span>
      </div>
      <div className="flex flex-col gap-6">
        <span className="text-3xl text-white">Project information</span>
        <FormInput
          label="Project Name"
          placeholder="Project Name"
          className="w-[302px]"
        />
        <FormInput
          label="Project Description"
          placeholder="Project Description"
          className="w-full"
        />
        <FormInput
          label="Target Investment Amount(£)"
          placeholder="Target Investment Amount(£)"
          className="w-full"
        />
        <div className="grid grid-cols-2 gap-6">
          <Dropdown
            options={infrastructureTypes}
            value={infrastructureType}
            onChange={handleInfrastructureChange}
            label="Infrastructure Type"
            placeholder="Select infrastructure type"
          />

          <Dropdown
            options={projectStatuses}
            value={projectStatus}
            onChange={handleProjectStatusChange}
            label="Project Status"
            placeholder="Select project status"
          />

          <Dropdown
            options={raisedOptions}
            value={raisedBefore}
            onChange={handleRaisedBeforeChange}
            label="Raised before ?"
            placeholder="Select option"
          />
        </div>
        <FormInput label="Website Link" placeholder="URL" className="w-full" />
        <FormInput
          label="Social Media Link"
          placeholder="URL"
          className="w-full"
        />
        <div className="flex flex-col gap-3">
          <span className="text-sm text-white">Proposal File</span>
          <FileUploadWithPreview onFileChange={() => null} type="pdf" />
          <span className="text-[10px] text-gray-600">
            Hash proposal:
            0x0582bd2c13fff71d7f40ef5586e3f4da05a3a61fe5ba9f0b4d06e99905ab83ea
          </span>
        </div>
      </div>
      <div className="w-full h-fit flex justify-between items-center">
        <CustomButton
          variant="canceled"
          className="w-32 h-11 flex justify-center items-center gap-2"
        >
          <ArrowLeft size={24} />
          Back
        </CustomButton>
        <CustomButton
          variant="filled"
          className="w-fit h-11 flex justify-center items-center"
        >
          Continue to Payment
        </CustomButton>
      </div>
    </div>
  );
}
