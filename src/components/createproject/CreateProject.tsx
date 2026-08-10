'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  getProject,
  inviteProjectMember,
  removeProjectMember,
  saveProjectCampaign,
  saveProjectContact,
  saveProjectInformation,
  saveProjectMilestones,
  submitProjectDraft,
  uploadProjectDocument,
  ApiClientError,
  type AccountRole,
  type ProjectCampaignPayload,
  type ProjectContactPayload,
  type ProjectInformationPayload,
  type ProjectResponse,
} from '@/lib/backend-auth-client';
import { HARDWIRED_PROJECT_MODEL } from '@/lib/project-digital-twin';
import { SegmentedStepProgress } from '@/components/ui/segmented-step-progress';

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

const wizardSteps: Array<{ id: Step; label: string }> = [
  { id: 'model', label: 'Funding Model' },
  { id: 'contact', label: 'Contact' },
  { id: 'project', label: 'Project Info' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'campaign', label: 'Campaign' },
  { id: 'review', label: 'Review' },
  { id: 'submitted', label: 'Submitted' },
];

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

function formatRoleLabel(role: string | null | undefined) {
  if (!role) {
    return '';
  }

  if (role === 'project_owner') {
    return 'Client';
  }

  if (role === 'governance') {
    return 'DAO';
  }

  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const emptyMilestone = (): MilestoneDraft => ({
  name: '',
  cost: '',
  end_date: '',
  component_external_ids: [],
});

// Exhaustive over ProjectDraftStep -- no default branch, so a future
// server-side enum change that isn't mirrored here fails to compile
// instead of silently falling through to 'contact'.
function stepFromProject(project: ProjectResponse): Step {
  if (project.submission_status === 'submitted') {
    return 'review';
  }

  switch (project.current_step) {
    case 'contact_information':
      return 'contact';
    case 'project_information':
      return 'project';
    case 'project_milestones':
      return 'milestones';
    case 'campaign_details':
      return 'campaign';
    case 'review':
      return 'review';
    case 'submitted':
      return 'submitted';
  }
}

function SelectField({
  label,
  value,
  onChange,
  children,
  invalid = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  invalid?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-white">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid || undefined}
        className={`h-12 rounded-lg border bg-[#131C2F] px-4 font-mono text-sm text-white outline-none transition focus:ring-2 ${
          invalid
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40'
            : 'border-transparent focus:border-primary focus:ring-primary/40'
        }`}
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
  invalid = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-white">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder={label}
        aria-invalid={invalid || undefined}
        className={`rounded-lg border bg-[#131C2F] px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-[#51515E] focus:ring-2 ${
          invalid
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40'
            : 'border-transparent focus:border-primary focus:ring-primary/40'
        }`}
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
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(Boolean(projectId));
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AccountRole>('investor');
  const [isInviting, setIsInviting] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  useEffect(() => {
    if (!backendUser || projectId) {
      return;
    }

    setContact((current) => ({
      first_name: current.first_name || backendUser.first_name || '',
      last_name: current.last_name || backendUser.last_name || '',
      email: current.email || backendUser.email || '',
      title: current.title || formatRoleLabel(backendUser.role),
      phone_number: current.phone_number || backendUser.phone_number || '',
    }));
  }, [backendUser, projectId]);

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

  const hydrateProjectDraft = useCallback(
    (nextProject: ProjectResponse) => {
      setProject(nextProject);
      setContact({
        first_name: nextProject.contact?.first_name ?? contact.first_name,
        last_name: nextProject.contact?.last_name ?? contact.last_name,
        email: nextProject.contact?.email ?? contact.email,
        title: nextProject.contact?.title ?? contact.title,
        phone_number: nextProject.contact?.phone_number ?? contact.phone_number,
      });
      setProjectInfo({
        name: nextProject.name ?? '',
        description: nextProject.description ?? '',
        target_investment_amount: nextProject.target_investment_amount ?? '',
        infrastructure_type: nextProject.infrastructure_type ?? 'wind_energy',
        project_status: nextProject.project_status ?? 'ready_to_launch',
        raised_before: Boolean(nextProject.raised_before),
        website_url: nextProject.website_url ?? '',
        social_url: nextProject.social_url ?? '',
        proposal_document: nextProject.documents[0]
          ? {
              file_name: nextProject.documents[0].file_name,
              mime_type: nextProject.documents[0].mime_type,
              size_bytes: nextProject.documents[0].size_bytes,
              checksum: nextProject.documents[0].checksum,
              storage_url: nextProject.documents[0].storage_url,
            }
          : undefined,
      });
      hydrateMilestonesFromProject(nextProject);
      setCampaign({
        token_name: nextProject.campaign?.token_name ?? '',
        digital_asset_supply: nextProject.campaign?.digital_asset_supply ?? '',
        price: nextProject.campaign?.price ?? '',
        currency: nextProject.campaign?.currency ?? 'USDC',
        min_raise: nextProject.campaign?.min_raise ?? '',
        max_raise: nextProject.campaign?.max_raise ?? '',
        min_contribution: nextProject.campaign?.min_contribution ?? '',
        max_contribution: nextProject.campaign?.max_contribution ?? '',
        start_date: nextProject.campaign?.start_date?.slice(0, 10) ?? '',
        end_date: nextProject.campaign?.end_date?.slice(0, 10) ?? '',
        general_contractor_wallet_address:
          nextProject.campaign?.general_contractor_wallet_address ?? '',
        pledge_address: nextProject.campaign?.pledge_address ?? '',
      });
      setStep(stepFromProject(nextProject));
    },
    [
      contact.email,
      contact.first_name,
      contact.last_name,
      contact.phone_number,
      contact.title,
    ]
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
    setFieldErrors({});

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
            if (retryError instanceof ApiClientError && retryError.fields) {
              setFieldErrors(retryError.fields);
            }
            setError(
              retryMessage.startsWith('Validation failed')
                ? 'Please complete the highlighted fields before continuing.'
                : retryMessage
            );
            return;
          }
        }
      }

      if (caughtError instanceof ApiClientError && caughtError.fields) {
        setFieldErrors(caughtError.fields);
      }
      setError(
        message.startsWith('Validation failed')
          ? 'Please complete the highlighted fields before continuing.'
          : message
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleInviteMember() {
    if (!project) return;

    let accessToken = backendAccessToken;

    if (!accessToken) {
      accessToken = await refreshSession();
    }

    if (!accessToken) {
      setMemberError('Please sign in again before inviting a member.');
      return;
    }

    setIsInviting(true);
    setMemberError(null);

    try {
      const updated = await inviteProjectMember(accessToken, project.id, {
        email: inviteEmail,
        role: inviteRole,
      });
      setProject(updated);
      setInviteEmail('');
    } catch (caughtError) {
      setMemberError(
        caughtError instanceof Error ? caughtError.message : 'Request failed'
      );
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!project) return;

    let accessToken = backendAccessToken;

    if (!accessToken) {
      accessToken = await refreshSession();
    }

    if (!accessToken) {
      setMemberError('Please sign in again before removing a member.');
      return;
    }

    setMemberError(null);

    try {
      const updated = await removeProjectMember(
        accessToken,
        project.id,
        userId
      );
      setProject(updated);
    } catch (caughtError) {
      setMemberError(
        caughtError instanceof Error ? caughtError.message : 'Request failed'
      );
    }
  }

  function clearFieldError(field: string) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function updateContact(field: keyof ProjectContactPayload, value: string) {
    setContact((current) => ({ ...current, [field]: value }));
  }

  function updateProjectInfo(
    field: keyof ProjectInformationPayload,
    value: string | boolean | ProjectInformationPayload['proposal_document']
  ) {
    clearFieldError(field);
    setProjectInfo((current) => ({ ...current, [field]: value }));
  }

  function updateCampaign(field: keyof ProjectCampaignPayload, value: string) {
    setCampaign((current) => ({ ...current, [field]: value }));
  }

  async function handleProposalFileChange(file: File | undefined) {
    if (!file) {
      updateProjectInfo('proposal_document', undefined);
      setFieldErrors((current) => ({
        ...current,
        proposal_document: 'Proposal file is required',
      }));
      return;
    }

    let accessToken = backendAccessToken;

    if (!accessToken) {
      accessToken = await refreshSession();
    }

    if (!accessToken) {
      setError('Please sign in again before uploading a proposal file.');
      return;
    }

    setIsUploadingDocument(true);
    setError(null);

    try {
      const document = await uploadProjectDocument(accessToken, file);
      updateProjectInfo('proposal_document', document);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : 'Proposal upload failed.';
      updateProjectInfo('proposal_document', undefined);
      setError(message);
    } finally {
      setIsUploadingDocument(false);
    }
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

  useEffect(() => {
    if (!projectId) {
      setIsLoadingProject(false);
      return;
    }

    const currentProjectId = projectId;
    let isMounted = true;

    async function loadProject() {
      let accessToken = backendAccessToken;

      if (!accessToken) {
        accessToken = await refreshSession();
      }

      if (!accessToken) {
        if (isMounted) {
          setError('Please sign in again before opening this project.');
          setIsLoadingProject(false);
        }
        return;
      }

      try {
        const existingProject = await getProject(accessToken, currentProjectId);

        if (isMounted) {
          hydrateProjectDraft(existingProject);
          setIsLoadingProject(false);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to open project.'
          );
          setIsLoadingProject(false);
        }
      }
    }

    void loadProject();

    return () => {
      isMounted = false;
    };
  }, [backendAccessToken, hydrateProjectDraft, projectId, refreshSession]);

  if (isLoadingProject) {
    return (
      <CardView width="1015px" height="728px" padding="p-12" className="gap-6">
        <span className="chakra-petch text-3xl text-white">
          Opening project…
        </span>
      </CardView>
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
      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="chakra-petch text-4xl font-semibold text-white">
            {step === 'model' ? 'Choose crowdfunding models' : 'Create Project'}
          </span>
        </div>
        <SegmentedStepProgress steps={wizardSteps} currentStep={step} />
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
            invalid={Boolean(fieldErrors.name)}
          />
          <TextareaField
            label="Project Description"
            value={projectInfo.description}
            onChange={(value) => updateProjectInfo('description', value)}
            invalid={Boolean(fieldErrors.description)}
          />
          <FormInput
            label="Target Investment Amount(£)"
            placeholder="Target Investment Amount(£)"
            value={projectInfo.target_investment_amount}
            onChange={(event) =>
              updateProjectInfo('target_investment_amount', event.target.value)
            }
            invalid={Boolean(fieldErrors.target_investment_amount)}
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
              invalid={Boolean(fieldErrors.infrastructure_type)}
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
              invalid={Boolean(fieldErrors.project_status)}
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
              invalid={Boolean(fieldErrors.raised_before)}
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
            invalid={Boolean(fieldErrors.website_url)}
          />
          <FormInput
            label="Social Media Link"
            placeholder="URL"
            value={projectInfo.social_url}
            onChange={(event) =>
              updateProjectInfo('social_url', event.target.value)
            }
            invalid={Boolean(fieldErrors.social_url)}
          />
          <label className="flex flex-col gap-2 text-sm font-medium text-white">
            Proposal File
            <input
              type="file"
              accept="application/pdf"
              disabled={isUploadingDocument || isSaving}
              onChange={(event) => {
                void handleProposalFileChange(event.target.files?.[0]);
              }}
              aria-invalid={Boolean(fieldErrors.proposal_document) || undefined}
              className={`rounded-lg border border-dashed bg-[#131C2F] px-4 py-3 font-mono text-sm text-white file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-black disabled:cursor-not-allowed disabled:opacity-60 ${
                fieldErrors.proposal_document
                  ? 'border-red-500'
                  : 'border-card-border'
              }`}
            />
            <span className="font-mono text-xs text-gray-400">
              {isUploadingDocument
                ? 'Uploading proposal…'
                : projectInfo.proposal_document?.storage_url
                  ? `Uploaded: ${projectInfo.proposal_document.file_name ?? 'proposal.pdf'}`
                  : 'PDF, max 10MB.'}
            </span>
          </label>
          <WizardActions
            onBack={() => setStep('contact')}
            isSaving={isSaving || isUploadingDocument}
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
            <h3 className="chakra-petch text-xl text-white">Project Team</h3>
            <p className="mt-1 font-mono text-xs text-gray-400">
              Add a contractor, investor, DAO, or auditor account onto this
              project. They must already have an InfraFund account.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {project.members.length === 0 ? (
                <p className="font-mono text-sm text-gray-500">
                  No team members yet.
                </p>
              ) : (
                project.members.map((member) => (
                  <div
                    key={`${member.user_id}-${member.role}`}
                    className="flex items-center justify-between rounded-xl border border-card-border bg-[#0C0C0D]/45 px-4 py-3"
                  >
                    <div>
                      <p className="chakra-petch text-sm text-white">
                        {[member.first_name, member.last_name]
                          .filter(Boolean)
                          .join(' ') ||
                          member.email ||
                          member.user_id}
                      </p>
                      <p className="font-mono text-xs text-gray-400">
                        {formatRoleLabel(member.role)}
                        {member.email ? ` · ${member.email}` : ''}
                      </p>
                    </div>
                    {member.user_id !== project.owner_user_id ? (
                      <CustomButton
                        variant="outlined"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => handleRemoveMember(member.user_id)}
                      >
                        Remove
                      </CustomButton>
                    ) : (
                      <span className="font-mono text-xs text-gray-500">
                        Owner
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-card-border pt-5 sm:flex-row sm:items-end">
              <FormInput
                label="Invite by email"
                type="email"
                placeholder="teammate@example.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                className="flex-1"
              />
              <SelectField
                label="Role"
                value={inviteRole}
                onChange={(value) => setInviteRole(value as AccountRole)}
              >
                <option value="investor">Investor</option>
                <option value="contractor">Contractor</option>
                <option value="governance">DAO</option>
                <option value="auditor">Auditor</option>
              </SelectField>
              <CustomButton
                variant="outlined"
                disabled={!inviteEmail || isInviting}
                onClick={handleInviteMember}
              >
                {isInviting ? 'Adding…' : 'Add to project'}
              </CustomButton>
            </div>
            {memberError ? (
              <p className="mt-3 font-mono text-sm text-red-400">
                {memberError}
              </p>
            ) : null}
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
