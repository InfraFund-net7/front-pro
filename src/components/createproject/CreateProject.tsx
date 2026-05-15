'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChartNoAxesCombined,
  CreditCard,
  HandHeart,
  Rocket,
} from 'lucide-react';
import CardView from '../ui/card-view';
import { CustomButton } from '../ui/custom-button';
import { FormInput } from '../ui/form-input';
import { useAuthSession } from '@/components/auth/auth-session-provider';
import {
  createProjectDraft,
  saveProjectCampaign,
  saveProjectContact,
  saveProjectInformation,
  saveProjectMilestones,
  submitProjectDraft,
  type ProjectCampaignPayload,
  type ProjectContactPayload,
  type ProjectInformationPayload,
  type ProjectResponse,
} from '@/lib/backend-auth-client';
import { HARDWIRED_PROJECT_MODEL } from '@/lib/project-digital-twin';

type Step =
  | 'model'
  | 'contact'
  | 'project'
  | 'milestones'
  | 'campaign'
  | 'review'
  | 'submitted';

type MilestoneDraft = {
  name: string;
  cost: string;
  end_date: string;
  component_external_ids: string[];
};

const crowdfundingModels = [
  {
    title: 'Charity',
    description: 'Donation-based funding is coming later.',
    icon: HandHeart,
    disabled: true,
  },
  {
    title: 'Pre-Sale',
    description: 'Raise funds before launch with a base crowdfunding campaign.',
    icon: Rocket,
    disabled: false,
  },
  {
    title: 'Equity',
    description: 'Equity campaigns are coming later.',
    icon: ChartNoAxesCombined,
    disabled: true,
  },
  {
    title: 'Debt',
    description: 'Debt campaigns are coming later.',
    icon: CreditCard,
    disabled: true,
  },
];

const infrastructureOptions = [
  { value: 'wind_energy', label: 'Wind Energy' },
  { value: 'solar_power', label: 'Solar Power' },
  { value: 'hydroelectric', label: 'Hydroelectric' },
  { value: 'geothermal', label: 'Geothermal' },
  { value: 'nuclear', label: 'Nuclear' },
  { value: 'other', label: 'Other' },
];

const projectStatusOptions = [
  { value: 'ready_to_launch', label: 'Ready to launch' },
  { value: 'in_development', label: 'In Development' },
  { value: 'planning', label: 'Planning' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
];

const emptyMilestone = (): MilestoneDraft => ({
  name: '',
  cost: '',
  end_date: '',
  component_external_ids: [],
});

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-white">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-lg border border-transparent bg-[#131C2F] px-4 font-mono text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
      >
        {children}
      </select>
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-white">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder={label}
        className="rounded-lg border border-transparent bg-[#131C2F] px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-[#51515E] focus:border-primary focus:ring-2 focus:ring-primary/40"
      />
    </label>
  );
}

function FieldValue({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-xs text-gray-400">{label}</span>
      <span className="chakra-petch text-base text-white">{value || '—'}</span>
    </div>
  );
}

export default function CreateProject() {
  const { backendAccessToken, backendUser, refreshSession } = useAuthSession();
  const [step, setStep] = useState<Step>('model');
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [contact, setContact] = useState<ProjectContactPayload>({
    first_name: '',
    last_name: '',
    email: '',
    title: '',
    phone_number: '',
  });
  const [projectInfo, setProjectInfo] = useState<ProjectInformationPayload>({
    name: '',
    description: '',
    target_investment_amount: '',
    infrastructure_type: 'wind_energy',
    project_status: 'ready_to_launch',
    raised_before: false,
    website_url: '',
    social_url: '',
  });
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    emptyMilestone(),
  ]);
  const [campaign, setCampaign] = useState<ProjectCampaignPayload>({
    token_name: '',
    digital_asset_supply: '',
    price: '',
    currency: 'USDC',
    min_raise: '',
    max_raise: '',
    min_contribution: '',
    max_contribution: '',
    start_date: '',
    end_date: '',
    general_contractor_wallet_address: '',
    pledge_address: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canCreateProject = backendUser?.role === 'project_owner';
  const availableComponents =
    project?.digital_twin_model?.components ??
    HARDWIRED_PROJECT_MODEL.components.map((component, index) => ({
      id: component.externalId,
      external_id: component.externalId,
      display_name: component.displayName,
      node_name: component.nodeName,
      category: component.category,
      sort_order: index,
      is_visible: component.isVisible,
    }));
  const visibleComponentCount = useMemo(
    () =>
      availableComponents.filter((component) => component.is_visible).length,
    [availableComponents]
  );

  async function persist<T>(
    action: (accessToken: string) => Promise<T>,
    onSuccess: (value: T) => void
  ) {
    let accessToken = backendAccessToken;

    if (!accessToken) {
      accessToken = await refreshSession();
    }

    if (!accessToken) {
      setError('Please sign in again before creating a project.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await action(accessToken);
      onSuccess(result);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Request failed';

      if (/invalid access token|session expired/i.test(message)) {
        const refreshedToken = await refreshSession();

        if (refreshedToken) {
          try {
            const retryResult = await action(refreshedToken);
            onSuccess(retryResult);
            return;
          } catch (retryError) {
            const retryMessage =
              retryError instanceof Error
                ? retryError.message
                : 'Request failed';
            setError(
              retryMessage.startsWith('Validation failed')
                ? 'Please complete the required fields before continuing.'
                : retryMessage
            );
            return;
          }
        }
      }

      setError(
        message.startsWith('Validation failed')
          ? 'Please complete the required fields before continuing.'
          : message
      );
    } finally {
      setIsSaving(false);
    }
  }

  function updateContact(field: keyof ProjectContactPayload, value: string) {
    setContact((current) => ({ ...current, [field]: value }));
  }

  function updateProjectInfo(
    field: keyof ProjectInformationPayload,
    value: string | boolean | ProjectInformationPayload['proposal_document']
  ) {
    setProjectInfo((current) => ({ ...current, [field]: value }));
  }

  function updateCampaign(field: keyof ProjectCampaignPayload, value: string) {
    setCampaign((current) => ({ ...current, [field]: value }));
  }

  function updateMilestone(
    index: number,
    field: keyof MilestoneDraft,
    value: string
  ) {
    setMilestones((current) =>
      current.map((milestone, currentIndex) =>
        currentIndex === index
          ? {
              ...milestone,
              [field]: value,
            }
          : milestone
      )
    );
  }

  function toggleMilestoneComponent(index: number, externalId: string) {
    setMilestones((current) =>
      current.map((milestone, currentIndex) => {
        if (currentIndex !== index) {
          return milestone;
        }

        const alreadySelected =
          milestone.component_external_ids.includes(externalId);

        return {
          ...milestone,
          component_external_ids: alreadySelected
            ? milestone.component_external_ids.filter(
                (value) => value !== externalId
              )
            : [...milestone.component_external_ids, externalId],
        };
      })
    );
  }

  function addMilestone() {
    setMilestones((current) => [...current, emptyMilestone()]);
  }

  function removeMilestone(index: number) {
    setMilestones((current) => {
      if (current.length === 1) {
        return [emptyMilestone()];
      }

      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  function hydrateMilestonesFromProject(nextProject: ProjectResponse) {
    setMilestones(
      nextProject.milestones.length > 0
        ? nextProject.milestones.map((milestone) => ({
            name: milestone.name,
            cost: milestone.cost ?? '',
            end_date: milestone.end_date?.slice(0, 10) ?? '',
            component_external_ids: milestone.components.map(
              (component) => component.external_id
            ),
          }))
        : [emptyMilestone()]
    );
  }

  if (!canCreateProject) {
    return (
      <CardView width="1015px" height="728px" padding="p-12" className="gap-6">
        <div className="flex max-w-2xl flex-col gap-4">
          <span className="chakra-petch text-4xl font-semibold text-white">
            Create Project
          </span>
          <span className="font-mono text-sm leading-7 text-[#C7CAD5]">
            Project creation is available only for accounts with the
            project_owner role. Switch to a project owner account to apply for a
            new project setup.
          </span>
        </div>
      </CardView>
    );
  }

  return (
    <CardView
      width="1015px"
      height="auto"
      padding="p-12"
      className="min-h-[728px] gap-8"
    >
      <div className="flex w-full flex-col gap-2">
        <span className="chakra-petch text-4xl font-semibold text-white">
          {step === 'model' ? 'Choose crowdfunding models' : 'Create Project'}
        </span>
        {step === 'model' ? (
          <span className="font-mono text-sm leading-7 text-[#C7CAD5]">
            The next step is choosing the right funding model. Let’s get you
            started!
          </span>
        ) : null}
        {error ? (
          <div className="mt-2 rounded-lg border border-error/50 bg-error/10 px-4 py-3 font-mono text-xs text-error">
            {error}
          </div>
        ) : null}
      </div>

      {step === 'model' ? (
        <div className="flex w-full flex-col gap-4">
          {crowdfundingModels.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                type="button"
                disabled={item.disabled || isSaving}
                onClick={() =>
                  persist(
                    (accessToken) => createProjectDraft(accessToken),
                    (draft) => {
                      setProject(draft);
                      hydrateMilestonesFromProject(draft);
                      setStep('contact');
                    }
                  )
                }
                className={`flex min-h-[102px] w-full items-center gap-4 rounded-[20px] border px-6 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  item.disabled
                    ? 'cursor-not-allowed border-card-border bg-[#101827]/50 opacity-50'
                    : 'border-card-border bg-[#151E2F80] hover:border-primary/50 hover:bg-[#1F2A40]'
                }`}
              >
                <Icon className="size-10 text-primary" />
                <span className="flex flex-1 flex-col gap-1">
                  <span className="chakra-petch text-lg font-medium text-white">
                    {item.title}
                  </span>
                  <span className="font-mono text-sm text-[#8087A3]">
                    {item.description}
                  </span>
                </span>
                {item.disabled ? null : <ArrowRight className="text-white" />}
              </button>
            );
          })}
        </div>
      ) : null}

      {step === 'contact' ? (
        <form
          className="flex w-full flex-col gap-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (!project) return;
            persist(
              (accessToken) =>
                saveProjectContact(accessToken, project.id, contact),
              (updated) => {
                setProject(updated);
                setStep('project');
              }
            );
          }}
        >
          <span className="chakra-petch text-3xl text-white">
            Contact information
          </span>
          <div className="grid grid-cols-2 gap-6">
            <FormInput
              label="First Name"
              placeholder="First Name"
              value={contact.first_name}
              onChange={(event) =>
                updateContact('first_name', event.target.value)
              }
            />
            <FormInput
              label="Last Name"
              placeholder="Last Name"
              value={contact.last_name}
              onChange={(event) =>
                updateContact('last_name', event.target.value)
              }
            />
            <FormInput
              label="Email"
              placeholder="Email"
              type="email"
              value={contact.email}
              onChange={(event) => updateContact('email', event.target.value)}
            />
            <FormInput
              label="Title"
              placeholder="Title"
              value={contact.title}
              onChange={(event) => updateContact('title', event.target.value)}
            />
            <FormInput
              label="Phone Number(optional)"
              placeholder="Phone Number(optional)"
              value={contact.phone_number}
              onChange={(event) =>
                updateContact('phone_number', event.target.value)
              }
            />
          </div>
          <WizardActions onBack={() => setStep('model')} isSaving={isSaving} />
        </form>
      ) : null}

      {step === 'project' ? (
        <form
          className="flex w-full flex-col gap-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (!project) return;
            persist(
              (accessToken) =>
                saveProjectInformation(accessToken, project.id, projectInfo),
              (updated) => {
                setProject(updated);
                setStep('milestones');
              }
            );
          }}
        >
          <span className="chakra-petch text-3xl text-white">
            Project information
          </span>
          <FormInput
            label="Project Name"
            placeholder="Project Name"
            value={projectInfo.name}
            onChange={(event) => updateProjectInfo('name', event.target.value)}
            className="w-[302px]"
          />
          <TextareaField
            label="Project Description"
            value={projectInfo.description}
            onChange={(value) => updateProjectInfo('description', value)}
          />
          <FormInput
            label="Target Investment Amount(£)"
            placeholder="Target Investment Amount(£)"
            value={projectInfo.target_investment_amount}
            onChange={(event) =>
              updateProjectInfo('target_investment_amount', event.target.value)
            }
          />
          <div className="grid grid-cols-2 gap-6">
            <SelectField
              label="Project Type"
              value="renewable_energy"
              onChange={() => null}
            >
              <option value="renewable_energy">Renewable Energy</option>
            </SelectField>
            <SelectField
              label="Infrastructure Type"
              value={projectInfo.infrastructure_type}
              onChange={(value) =>
                updateProjectInfo('infrastructure_type', value)
              }
            >
              {infrastructureOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Project Status"
              value={projectInfo.project_status}
              onChange={(value) => updateProjectInfo('project_status', value)}
            >
              {projectStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Raised before ?"
              value={projectInfo.raised_before ? 'yes' : 'no'}
              onChange={(value) =>
                updateProjectInfo('raised_before', value === 'yes')
              }
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </SelectField>
          </div>
          <FormInput
            label="Website Link"
            placeholder="URL"
            value={projectInfo.website_url}
            onChange={(event) =>
              updateProjectInfo('website_url', event.target.value)
            }
          />
          <FormInput
            label="Social Media Link"
            placeholder="URL"
            value={projectInfo.social_url}
            onChange={(event) =>
              updateProjectInfo('social_url', event.target.value)
            }
          />
          <label className="flex flex-col gap-2 text-sm font-medium text-white">
            Proposal File
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => {
                const file = event.target.files?.[0];
                updateProjectInfo(
                  'proposal_document',
                  file
                    ? {
                        file_name: file.name,
                        mime_type: file.type || 'application/pdf',
                        size_bytes: file.size,
                      }
                    : undefined
                );
              }}
              className="rounded-lg border border-dashed border-card-border bg-[#131C2F] px-4 py-3 font-mono text-sm text-white file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-black"
            />
          </label>
          <WizardActions
            onBack={() => setStep('contact')}
            isSaving={isSaving}
          />
        </form>
      ) : null}

      {step === 'milestones' ? (
        <form
          className="flex w-full flex-col gap-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (!project) return;
            persist(
              (accessToken) =>
                saveProjectMilestones(accessToken, project.id, {
                  milestones,
                }),
              (updated) => {
                setProject(updated);
                hydrateMilestonesFromProject(updated);
                setStep('campaign');
              }
            );
          }}
        >
          <div>
            <span className="chakra-petch text-3xl text-white">
              Project Milestones
            </span>
            <p className="mt-2 font-mono text-sm text-gray-400">
              Define the milestones that structure the project setup and future
              construction reporting.
            </p>
          </div>

          <div className="rounded-[20px] border border-card-border bg-[#101827]/60 p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">
                  Hardwired 3D model
                </p>
                <h3 className="chakra-petch mt-2 text-xl text-white">
                  {project?.digital_twin_model?.name ??
                    HARDWIRED_PROJECT_MODEL.name}
                </h3>
              </div>
              <div className="font-mono text-xs text-gray-400">
                {visibleComponentCount} visible components available
              </div>
            </div>
            <div className="mt-4 grid gap-3 font-mono text-sm text-gray-300 md:grid-cols-2">
              <span>
                Asset:{' '}
                {project?.digital_twin_model?.asset_url ??
                  HARDWIRED_PROJECT_MODEL.assetUrl}
              </span>
              <span>
                Format:{' '}
                {project?.digital_twin_model?.format ??
                  HARDWIRED_PROJECT_MODEL.format}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className="rounded-[20px] border border-card-border bg-[#101827]/60 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="chakra-petch text-lg text-white">
                    Milestone {index + 1}
                  </h3>
                  <button
                    type="button"
                    className="font-mono text-xs text-error transition hover:text-white"
                    onClick={() => removeMilestone(index)}
                    disabled={isSaving}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormInput
                    label="Name"
                    placeholder="Name"
                    value={milestone.name}
                    onChange={(event) =>
                      updateMilestone(index, 'name', event.target.value)
                    }
                  />
                  <FormInput
                    label="Cost"
                    placeholder="Cost"
                    value={milestone.cost}
                    onChange={(event) =>
                      updateMilestone(index, 'cost', event.target.value)
                    }
                  />
                  <FormInput
                    label="End Date"
                    placeholder="End Date"
                    type="date"
                    value={milestone.end_date}
                    onChange={(event) =>
                      updateMilestone(index, 'end_date', event.target.value)
                    }
                  />
                </div>
                <div className="mt-5">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-gray-400">
                    Linked 3D components
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {availableComponents.map((component) => {
                      const checked = milestone.component_external_ids.includes(
                        component.external_id
                      );

                      return (
                        <label
                          key={component.external_id}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                            checked
                              ? 'border-primary/50 bg-primary/10'
                              : 'border-card-border bg-[#0C0C0D]/40 hover:border-primary/30'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleMilestoneComponent(
                                index,
                                component.external_id
                              )
                            }
                            className="mt-1 h-4 w-4 accent-primary"
                          />
                          <span className="flex flex-col gap-1">
                            <span className="chakra-petch text-sm text-white">
                              {component.display_name}
                            </span>
                            <span className="font-mono text-xs text-gray-400">
                              {component.category}
                              {component.node_name
                                ? ` · Node ${component.node_name}`
                                : ' · Logical component only'}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="w-fit rounded-lg border border-dashed border-primary/40 px-4 py-2 font-mono text-sm text-primary transition hover:bg-primary/10"
            onClick={addMilestone}
            disabled={isSaving}
          >
            + Add milestone
          </button>

          <WizardActions
            onBack={() => setStep('project')}
            isSaving={isSaving}
          />
        </form>
      ) : null}

      {step === 'campaign' ? (
        <form
          className="flex w-full flex-col gap-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (!project) return;
            persist(
              (accessToken) =>
                saveProjectCampaign(accessToken, project.id, campaign),
              (updated) => {
                setProject(updated);
                setStep('review');
              }
            );
          }}
        >
          <div>
            <span className="chakra-petch text-3xl text-white">
              Crowdfunding Campaign Details
            </span>
          </div>
          <FormInput
            label="Token Name"
            placeholder="Token Name"
            value={campaign.token_name}
            onChange={(event) =>
              updateCampaign('token_name', event.target.value)
            }
          />
          <FormInput
            label="Digital Asset Supply"
            placeholder="Total supply"
            value={campaign.digital_asset_supply}
            onChange={(event) =>
              updateCampaign('digital_asset_supply', event.target.value)
            }
          />
          <FormInput
            label="Price"
            placeholder="Price"
            value={campaign.price}
            onChange={(event) => updateCampaign('price', event.target.value)}
          />
          <FormInput
            label="Currency"
            placeholder="USDC"
            value={campaign.currency}
            onChange={(event) => updateCampaign('currency', event.target.value)}
          />
          <div className="grid grid-cols-2 gap-6">
            <FormInput
              label="Min Raise"
              placeholder="Min Raise"
              value={campaign.min_raise}
              onChange={(event) =>
                updateCampaign('min_raise', event.target.value)
              }
            />
            <FormInput
              label="Max Raise"
              placeholder="Max Raise"
              value={campaign.max_raise}
              onChange={(event) =>
                updateCampaign('max_raise', event.target.value)
              }
            />
            <FormInput
              label="Min Donation"
              placeholder="Min Donation"
              value={campaign.min_contribution}
              onChange={(event) =>
                updateCampaign('min_contribution', event.target.value)
              }
            />
            <FormInput
              label="Max Donation"
              placeholder="Max Donation"
              value={campaign.max_contribution}
              onChange={(event) =>
                updateCampaign('max_contribution', event.target.value)
              }
            />
            <FormInput
              label="Start Date"
              placeholder="Start Date"
              type="date"
              value={campaign.start_date}
              onChange={(event) =>
                updateCampaign('start_date', event.target.value)
              }
            />
            <FormInput
              label="End Date"
              placeholder="End Date"
              type="date"
              value={campaign.end_date}
              onChange={(event) =>
                updateCampaign('end_date', event.target.value)
              }
            />
          </div>
          <FormInput
            label="General Contractor (GC) Wallet Address"
            placeholder="Wallet Address"
            value={campaign.general_contractor_wallet_address}
            onChange={(event) =>
              updateCampaign(
                'general_contractor_wallet_address',
                event.target.value
              )
            }
          />
          <FormInput
            label="Pledge Address"
            placeholder="Pledge Address"
            value={campaign.pledge_address}
            onChange={(event) =>
              updateCampaign('pledge_address', event.target.value)
            }
          />
          <WizardActions
            onBack={() => setStep('milestones')}
            isSaving={isSaving}
          />
        </form>
      ) : null}

      {step === 'review' && project ? (
        <div className="flex w-full flex-col gap-8">
          <div>
            <span className="chakra-petch text-3xl text-white">
              Review & confirm your project details
            </span>
            <p className="mt-2 font-mono text-sm text-gray-400">
              Review submission
            </p>
          </div>
          <div className="grid grid-cols-3 gap-8 pb-8">
            <FieldValue
              label="Project Name"
              value={project.name ?? undefined}
            />
            <FieldValue
              label="Token Name"
              value={project.campaign?.token_name ?? undefined}
            />
            <FieldValue label="Project Type" value="Renewable Energy" />
            <FieldValue
              label="Target Amount"
              value={`${project.target_investment_amount ?? '—'} ${project.target_investment_currency}`}
            />
            <FieldValue label="Crowdfunding" value="Pre-Sale" />
            <FieldValue
              label="3D Model"
              value={
                project.digital_twin_model?.name ?? HARDWIRED_PROJECT_MODEL.name
              }
            />
          </div>
          <FieldValue
            label="Project Description"
            value={project.description ?? undefined}
          />
          <div className="grid grid-cols-2 gap-6 pt-8">
            <FieldValue
              label="Name"
              value={
                project.contact
                  ? `${project.contact.first_name} ${project.contact.last_name}`
                  : null
              }
            />
            <FieldValue label="Email" value={project.contact?.email} />
            <FieldValue label="Phone" value={project.contact?.phone_number} />
            <FieldValue label="Title" value={project.contact?.title} />
          </div>
          <div className="rounded-[20px] border border-card-border bg-[#101827]/60 p-5">
            <h3 className="chakra-petch text-xl text-white">Milestones</h3>
            <div className="mt-4 flex flex-col gap-4">
              {project.milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="rounded-xl border border-card-border bg-[#0C0C0D]/45 p-4"
                >
                  <div className="grid gap-3 md:grid-cols-3">
                    <FieldValue
                      label={`Milestone ${index + 1}`}
                      value={milestone.name}
                    />
                    <FieldValue label="Cost" value={milestone.cost} />
                    <FieldValue
                      label="End Date"
                      value={milestone.end_date?.slice(0, 10)}
                    />
                  </div>
                  <FieldValue
                    label="Linked Components"
                    value={
                      milestone.components.length > 0
                        ? milestone.components
                            .map((component) => component.display_name)
                            .join(', ')
                        : 'No linked components'
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <p className="font-mono text-sm leading-7 text-[#C7CAD5]">
            Once submitted, payment is skipped for this implementation and the
            project is stored for review.
          </p>
          <WizardActions
            onBack={() => setStep('campaign')}
            isSaving={isSaving}
            nextLabel="Submit Project"
            onSubmit={() =>
              persist(
                (accessToken) => submitProjectDraft(accessToken, project.id),
                (updated) => {
                  setProject(updated);
                  setStep('submitted');
                }
              )
            }
          />
        </div>
      ) : null}

      {step === 'submitted' ? (
        <div className="flex flex-col gap-4">
          <span className="chakra-petch text-3xl text-white">
            Project submitted
          </span>
          <p className="font-mono text-sm leading-7 text-[#C7CAD5]">
            Your Pre-Sale project draft has been saved and submitted for setup
            review.
          </p>
        </div>
      ) : null}
    </CardView>
  );
}

function WizardActions({
  onBack,
  onSubmit,
  isSaving,
  nextLabel = 'Continue',
}: {
  onBack: () => void;
  onSubmit?: () => void;
  isSaving: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex w-full items-center justify-between pt-4">
      <CustomButton
        type="button"
        variant="canceled"
        className="flex h-11 w-32 items-center justify-center gap-2 text-sm"
        onClick={onBack}
        disabled={isSaving}
      >
        <ArrowLeft size={20} />
        Back
      </CustomButton>
      <CustomButton
        type={onSubmit ? 'button' : 'submit'}
        variant="filled"
        className="flex h-11 w-fit items-center justify-center text-sm"
        onClick={onSubmit}
        disabled={isSaving}
      >
        {isSaving ? 'Saving…' : nextLabel}
      </CustomButton>
    </div>
  );
}
