'use client';

import type { User } from '@openfort/openfort-js';
import { Modal } from '@/components/ui/modal';
import { CustomButton } from '@/components/ui/custom-button';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';
import { FormInput } from '@/components/ui/form-input';
import { NonResidentForm } from './non-resident-form';
import { useEffect, useMemo, useState } from 'react';

type Step = 1 | 2 | 3 | 'non_resident';
type UserType = 'individual' | 'organization';

export type QualificationRole = 'client' | 'investor' | 'contractor' | 'dao';

export interface QualificationSubmission {
  role: QualificationRole;
  type: UserType;
  organizationName?: string;
}

interface QualificationQuestionnaireProps {
  isOpen: boolean;
  openfortUser: User | null;
  submitError: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (submission: QualificationSubmission) => Promise<void>;
  onDisqualifiedSuccess: () => Promise<void>;
}

interface QuestionnaireDraft {
  step: Step;
  role: QualificationRole | null;
  type: UserType | null;
  organizationName: string;
  individualConfirmations: {
    ukResident: boolean;
    niNumber: boolean;
    over18: boolean;
  };
  organizationConfirmations: {
    ukBased: boolean;
    companyHouse: boolean;
    active: boolean;
  };
}

const DRAFT_KEY = 'infrafund:onboarding-draft';

const defaultDraft: QuestionnaireDraft = {
  step: 1,
  role: null,
  type: null,
  organizationName: '',
  individualConfirmations: {
    ukResident: true,
    niNumber: true,
    over18: true,
  },
  organizationConfirmations: {
    ukBased: true,
    companyHouse: true,
    active: true,
  },
};

const roleOptions: Array<{
  value: QualificationRole;
  title: string;
  description: string;
}> = [
  {
    value: 'client',
    title: 'Raise Funds',
    description:
      'Project owners and developers seeking capital for infrastructure projects.',
  },
  {
    value: 'investor',
    title: 'Invest in Assets',
    description:
      'Investors looking to discover and fund high-impact infrastructure opportunities.',
  },
  {
    value: 'contractor',
    title: 'Manage Construction',
    description:
      'EPCs and contractors supporting delivery and milestone execution.',
  },
  {
    value: 'dao',
    title: 'Join the DAO',
    description:
      'Governance participants helping guide protocol and treasury decisions.',
  },
];

function readDraft(): QuestionnaireDraft {
  if (typeof window === 'undefined') {
    return defaultDraft;
  }

  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);

    if (!raw) {
      return defaultDraft;
    }

    return {
      ...defaultDraft,
      ...(JSON.parse(raw) as Partial<QuestionnaireDraft>),
    };
  } catch {
    return defaultDraft;
  }
}

function clearDraft() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(DRAFT_KEY);
  }
}

export function QualificationQuestionnaire({
  isOpen,
  openfortUser,
  submitError,
  isSubmitting,
  onClose,
  onSubmit,
  onDisqualifiedSuccess,
}: QualificationQuestionnaireProps) {
  const [draft, setDraft] = useState<QuestionnaireDraft>(defaultDraft);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDraft(defaultDraft);
      setLocalError(null);
      return;
    }

    setDraft(readDraft());
    setLocalError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft, isOpen]);

  const currentError = submitError || localError;
  const isOrganizationReady =
    draft.type === 'organization'
      ? Boolean(draft.organizationName.trim())
      : true;

  const activeStepTitle = useMemo(() => {
    if (draft.step === 'non_resident') {
      return 'Contact Form';
    }

    return 'Qualification';
  }, [draft.step]);

  function updateDraft(partial: Partial<QuestionnaireDraft>) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ...partial,
    }));
  }

  function updateIndividualConfirmation(
    key: keyof QuestionnaireDraft['individualConfirmations']
  ) {
    setLocalError(null);
    setDraft((currentDraft) => ({
      ...currentDraft,
      individualConfirmations: {
        ...currentDraft.individualConfirmations,
        [key]: !currentDraft.individualConfirmations[key],
      },
    }));
  }

  function updateOrganizationConfirmation(
    key: keyof QuestionnaireDraft['organizationConfirmations']
  ) {
    setLocalError(null);
    setDraft((currentDraft) => ({
      ...currentDraft,
      organizationConfirmations: {
        ...currentDraft.organizationConfirmations,
        [key]: !currentDraft.organizationConfirmations[key],
      },
    }));
  }

  async function handleQualificationSubmit() {
    if (!draft.role || !draft.type) {
      return;
    }

    if (draft.type === 'individual') {
      if (
        !draft.individualConfirmations.ukResident ||
        !draft.individualConfirmations.niNumber
      ) {
        updateDraft({ step: 'non_resident' });
        return;
      }

      if (!draft.individualConfirmations.over18) {
        setLocalError(
          'We do not provide services to individuals under 18 years old.'
        );
        return;
      }
    } else {
      if (!draft.organizationName.trim()) {
        setLocalError('Company name is required for organization onboarding.');
        return;
      }

      if (
        !draft.organizationConfirmations.ukBased ||
        !draft.organizationConfirmations.companyHouse ||
        !draft.organizationConfirmations.active
      ) {
        updateDraft({ step: 'non_resident' });
        return;
      }
    }

    setLocalError(null);

    await onSubmit({
      role: draft.role,
      type: draft.type,
      organizationName:
        draft.type === 'organization'
          ? draft.organizationName.trim()
          : undefined,
    });
  }

  async function handleDisqualifiedSuccess() {
    clearDraft();
    await onDisqualifiedSuccess();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ModalTitle={activeStepTitle}
      width="42rem"
    >
      {draft.step === 'non_resident' && draft.type ? (
        <NonResidentForm
          type={draft.type}
          openfortUser={openfortUser}
          onBack={() => updateDraft({ step: 3 })}
          onSuccess={handleDisqualifiedSuccess}
        />
      ) : (
        <div className="flex w-full flex-col gap-8 py-2 text-left text-white">
          {draft.step === 1 ? (
            <>
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.2em] text-[#00FF87]">
                  Let&apos;s get started
                </p>
                <h3 className="text-3xl font-semibold">
                  What brings you to InfraFund?
                </h3>
              </div>

              <div className="grid gap-3">
                {roleOptions.map((option) => {
                  const isSelected = draft.role === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setLocalError(null);
                        updateDraft({ role: option.value });
                      }}
                      className={`rounded-2xl border px-5 py-4 text-left transition ${
                        isSelected
                          ? 'border-[#00FF87] bg-[#111827]'
                          : 'border-[#263247] bg-[#0F1722]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="text-lg font-semibold">
                          {option.title}
                        </div>
                        <div className="text-sm text-[#C7CAD5]">
                          {option.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <CustomButton
                className="w-full px-6 py-3 text-base"
                disabled={!draft.role}
                onClick={() => updateDraft({ step: 2 })}
              >
                Continue
              </CustomButton>
            </>
          ) : null}

          {draft.step === 2 ? (
            <>
              <div className="space-y-2">
                <h3 className="text-3xl font-semibold">
                  Are you an Individual or Organization?
                </h3>
                <p className="text-sm text-[#C7CAD5]">
                  We use this to route you through the right qualification
                  checks.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {(['individual', 'organization'] as const).map((option) => {
                  const isSelected = draft.type === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setLocalError(null);
                        updateDraft({ type: option });
                      }}
                      className={`rounded-2xl border px-5 py-8 text-left transition ${
                        isSelected
                          ? 'border-[#00FF87] bg-[#111827]'
                          : 'border-[#263247] bg-[#0F1722]'
                      }`}
                    >
                      <div className="text-xl font-semibold capitalize">
                        {option}
                      </div>
                    </button>
                  );
                })}
              </div>

              {draft.type === 'organization' ? (
                <FormInput
                  label="Company Name"
                  placeholder="Company Name"
                  value={draft.organizationName}
                  onChange={(event) =>
                    updateDraft({ organizationName: event.target.value })
                  }
                />
              ) : null}

              {currentError ? (
                <p className="text-sm text-red-400">{currentError}</p>
              ) : null}

              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <CustomButton
                  variant="outlined"
                  className="w-full px-6 py-3 text-base sm:w-1/2"
                  onClick={() => updateDraft({ step: 1 })}
                >
                  Back
                </CustomButton>
                <CustomButton
                  className="w-full px-6 py-3 text-base sm:w-1/2"
                  disabled={!draft.type || !isOrganizationReady}
                  onClick={() => updateDraft({ step: 3 })}
                >
                  Continue
                </CustomButton>
              </div>
            </>
          ) : null}

          {draft.step === 3 ? (
            <>
              <div className="space-y-2">
                <h3 className="text-3xl font-semibold">
                  First, please confirm the following.
                </h3>
                <p className="text-sm text-[#C7CAD5]">
                  All responses must remain selected to continue.
                </p>
              </div>

              <div className="space-y-4">
                {draft.type === 'individual' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => updateIndividualConfirmation('ukResident')}
                      className="flex w-full items-start gap-4 rounded-2xl border border-[#263247] bg-[#0F1722] p-4 text-left"
                    >
                      <CustomCheckbox
                        checked={draft.individualConfirmations.ukResident}
                        onToggle={() => undefined}
                        className="mt-1"
                      />
                      <span>I am currently a UK resident.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateIndividualConfirmation('niNumber')}
                      className="flex w-full items-start gap-4 rounded-2xl border border-[#263247] bg-[#0F1722] p-4 text-left"
                    >
                      <CustomCheckbox
                        checked={draft.individualConfirmations.niNumber}
                        onToggle={() => undefined}
                        className="mt-1"
                      />
                      <span>I have a valid UK national insurance number.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateIndividualConfirmation('over18')}
                      className="flex w-full items-start gap-4 rounded-2xl border border-[#263247] bg-[#0F1722] p-4 text-left"
                    >
                      <CustomCheckbox
                        checked={draft.individualConfirmations.over18}
                        onToggle={() => undefined}
                        className="mt-1"
                      />
                      <span>I am at least 18 years old.</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => updateOrganizationConfirmation('ukBased')}
                      className="flex w-full items-start gap-4 rounded-2xl border border-[#263247] bg-[#0F1722] p-4 text-left"
                    >
                      <CustomCheckbox
                        checked={draft.organizationConfirmations.ukBased}
                        onToggle={() => undefined}
                        className="mt-1"
                      />
                      <span>Our company is based in the UK.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateOrganizationConfirmation('companyHouse')
                      }
                      className="flex w-full items-start gap-4 rounded-2xl border border-[#263247] bg-[#0F1722] p-4 text-left"
                    >
                      <CustomCheckbox
                        checked={draft.organizationConfirmations.companyHouse}
                        onToggle={() => undefined}
                        className="mt-1"
                      />
                      <span>We have a valid UK Companies House number.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateOrganizationConfirmation('active')}
                      className="flex w-full items-start gap-4 rounded-2xl border border-[#263247] bg-[#0F1722] p-4 text-left"
                    >
                      <CustomCheckbox
                        checked={draft.organizationConfirmations.active}
                        onToggle={() => undefined}
                        className="mt-1"
                      />
                      <span>Our company is currently active.</span>
                    </button>
                  </>
                )}
              </div>

              {currentError ? (
                <p className="text-sm text-red-400">{currentError}</p>
              ) : null}

              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <CustomButton
                  variant="outlined"
                  className="w-full px-6 py-3 text-base sm:w-1/2"
                  onClick={() => updateDraft({ step: 2 })}
                  disabled={isSubmitting}
                >
                  Back
                </CustomButton>
                <CustomButton
                  className="w-full px-6 py-3 text-base sm:w-1/2"
                  onClick={handleQualificationSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Continuing...' : 'Continue'}
                </CustomButton>
              </div>
            </>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
