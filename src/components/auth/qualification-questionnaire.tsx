'use client';

import type { User } from '@privy-io/react-auth';
import { Modal } from '@/components/ui/modal';
import { CustomButton } from '@/components/ui/custom-button';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';
import { FormInput } from '@/components/ui/form-input';
import { NonResidentForm } from './non-resident-form';
import { useEffect, useMemo, useState } from 'react';
import {
  HandCoins,
  ScrollText,
  ClipboardCheck,
  TrendingUp,
  User as UserIcon,
  Building2,
  type LucideIcon,
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5 | 'non_resident';
type UserType = 'individual' | 'organization';

type QualificationRole = 'client' | 'contractor' | 'auditor' | 'investor';

export interface QualificationSubmission {
  role: QualificationRole;
  type: UserType;
  organizationName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function getPrivyEmail(user: User | null): string | null {
  return user?.email?.address || user?.google?.email || null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface QualificationQuestionnaireProps {
  isOpen: boolean;
  privyUser: User | null;
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
  firstName: string;
  lastName: string;
  contactFullName: string;
  phoneNumber: string;
  email: string;
  agreedToTerms: boolean;
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
  firstName: '',
  lastName: '',
  contactFullName: '',
  phoneNumber: '',
  email: '',
  agreedToTerms: false,
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
  icon: LucideIcon;
}> = [
  {
    value: 'client',
    title: 'Raise Fund',
    icon: HandCoins,
  },
  {
    value: 'contractor',
    title: 'Contract',
    icon: ScrollText,
  },
  {
    value: 'auditor',
    title: 'Audit',
    icon: ClipboardCheck,
  },
  {
    value: 'investor',
    title: 'Invest',
    icon: TrendingUp,
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
  privyUser,
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
  const allIndividualConfirmed =
    draft.individualConfirmations.ukResident &&
    draft.individualConfirmations.niNumber &&
    draft.individualConfirmations.over18;
  const allOrganizationConfirmed =
    draft.organizationConfirmations.ukBased &&
    draft.organizationConfirmations.companyHouse &&
    draft.organizationConfirmations.active;
  const contactName = useMemo(
    () => splitName(draft.contactFullName),
    [draft.contactFullName]
  );
  const hasFullContactName = Boolean(
    contactName.firstName && contactName.lastName
  );

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

  function handleStep3Continue() {
    setLocalError(null);

    if (draft.type === 'individual') {
      if (
        !draft.individualConfirmations.ukResident ||
        !draft.individualConfirmations.niNumber
      ) {
        updateDraft({ step: 'non_resident' });
        return;
      }

      if (!draft.individualConfirmations.over18) {
        return;
      }
    } else if (
      !draft.organizationConfirmations.ukBased ||
      !draft.organizationConfirmations.companyHouse ||
      !draft.organizationConfirmations.active
    ) {
      updateDraft({ step: 'non_resident' });
      return;
    }

    updateDraft({ step: 4 });
  }

  function handleStep4Continue() {
    setLocalError(null);

    if (getPrivyEmail(privyUser)) {
      void handleQualificationSubmit();
      return;
    }

    updateDraft({ step: 5 });
  }

  async function handleQualificationSubmit() {
    if (!draft.role || !draft.type) {
      return;
    }

    const resolvedEmail = getPrivyEmail(privyUser) || draft.email.trim();

    if (draft.type === 'individual') {
      if (!draft.firstName.trim() || !draft.lastName.trim()) {
        setLocalError('Please enter your first and last name.');
        return;
      }

      setLocalError(null);
      await onSubmit({
        role: draft.role,
        type: draft.type,
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        phoneNumber: draft.phoneNumber.trim() || undefined,
        email: resolvedEmail || undefined,
      });
      return;
    }

    const contactName = splitName(draft.contactFullName);

    if (!contactName.firstName || !contactName.lastName) {
      setLocalError("Please enter the contact's first and last name.");
      return;
    }

    if (!draft.organizationName.trim()) {
      setLocalError('Company name is required for organization onboarding.');
      return;
    }

    setLocalError(null);

    await onSubmit({
      role: draft.role,
      type: draft.type,
      organizationName: draft.organizationName.trim(),
      firstName: contactName.firstName,
      lastName: contactName.lastName,
      phoneNumber: draft.phoneNumber.trim() || undefined,
      email: resolvedEmail || undefined,
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
          privyUser={
            privyUser
              ? {
                  name: privyUser.google?.name ?? null,
                  email:
                    privyUser.linkedAccounts?.find((a) => a.type === 'email')
                      ?.address ?? null,
                }
              : null
          }
          onSuccess={handleDisqualifiedSuccess}
        />
      ) : (
        <div className="flex w-full flex-col gap-8 py-2 text-left text-white">
          {draft.step === 1 ? (
            <>
              <div className="space-y-2">
                <p className="text-sm text-[#C7CAD5]">Let&apos;s Get Started</p>
                <h3 className="text-3xl font-semibold">
                  What do you want to do with InfraFund?
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {roleOptions.map((option) => {
                  const isSelected = draft.role === option.value;
                  const Icon = option.icon;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setLocalError(null);
                        updateDraft({ role: option.value });
                      }}
                      className={`rounded-2xl border px-5 py-8 text-left transition ${
                        isSelected
                          ? 'border-[#00FF87] bg-[#111827]'
                          : 'border-[#263247] bg-[#0F1722]'
                      }`}
                    >
                      <Icon className="mb-6 h-7 w-7 text-primary" />
                      <div className="text-lg font-semibold">
                        {option.title}
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
                <p className="text-sm text-[#C7CAD5]">Let&apos;s Get Started</p>
                <h3 className="text-3xl font-semibold">
                  Are you an individual or a business?
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    {
                      value: 'individual',
                      title: 'Individual',
                      icon: UserIcon,
                    },
                    {
                      value: 'organization',
                      title: 'Organization',
                      icon: Building2,
                    },
                  ] as const
                ).map((option) => {
                  const isSelected = draft.type === option.value;
                  const Icon = option.icon;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setLocalError(null);
                        updateDraft({ type: option.value });
                      }}
                      className={`rounded-2xl border px-5 py-8 text-left transition ${
                        isSelected
                          ? 'border-[#00FF87] bg-[#111827]'
                          : 'border-[#263247] bg-[#0F1722]'
                      }`}
                    >
                      <Icon className="mb-6 h-7 w-7 text-primary" />
                      <div className="text-xl font-semibold">
                        {option.title}
                      </div>
                    </button>
                  );
                })}
              </div>

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
                  disabled={!draft.type}
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
              </div>

              <div className="space-y-4">
                {draft.type === 'individual' ? (
                  <>
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          updateIndividualConfirmation('ukResident')
                        }
                        className="flex w-full items-start gap-4 rounded-2xl border border-[#263247] bg-[#0F1722] p-4 text-left"
                      >
                        <CustomCheckbox
                          checked={draft.individualConfirmations.ukResident}
                          onToggle={() => undefined}
                          className="mt-1"
                        />
                        <span>I am currently a UK resident.</span>
                      </button>
                      {!draft.individualConfirmations.ukResident ? (
                        <p className="mt-2 text-sm text-red-400">
                          We are currently only accepting investments from UK
                          residents.
                        </p>
                      ) : null}
                    </div>
                    <div>
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
                        <span>
                          I have a valid UK national insurance number.
                        </span>
                      </button>
                      {!draft.individualConfirmations.niNumber ? (
                        <p className="mt-2 text-sm text-red-400">
                          We are currently only accepting investments from
                          people with a valid UK national insurance number.
                        </p>
                      ) : null}
                    </div>
                    <div>
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
                      {!draft.individualConfirmations.over18 ? (
                        <p className="mt-2 text-sm text-red-400">
                          We do not provide services to individuals under 18
                          years old.
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          updateOrganizationConfirmation('ukBased')
                        }
                        className="flex w-full items-start gap-4 rounded-2xl border border-[#263247] bg-[#0F1722] p-4 text-left"
                      >
                        <CustomCheckbox
                          checked={draft.organizationConfirmations.ukBased}
                          onToggle={() => undefined}
                          className="mt-1"
                        />
                        <span>Our company is based in the UK.</span>
                      </button>
                      {!draft.organizationConfirmations.ukBased ? (
                        <p className="mt-2 text-sm text-red-400">
                          We are currently only accepting investments from UK
                          companies.
                        </p>
                      ) : null}
                    </div>
                    <div>
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
                      {!draft.organizationConfirmations.companyHouse ? (
                        <p className="mt-2 text-sm text-red-400">
                          We are currently only accepting investments from
                          companies with a valid UK Companies House number.
                        </p>
                      ) : null}
                    </div>
                    <div>
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
                      {!draft.organizationConfirmations.active ? (
                        <p className="mt-2 text-sm text-red-400">
                          We are currently only accepting investments from
                          companies that are currently active.
                        </p>
                      ) : null}
                    </div>
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
                  className={`w-full px-6 py-3 text-base sm:w-1/2 ${
                    (
                      draft.type === 'individual'
                        ? !allIndividualConfirmed
                        : !allOrganizationConfirmed
                    )
                      ? 'opacity-60'
                      : ''
                  }`}
                  onClick={handleStep3Continue}
                  disabled={isSubmitting}
                >
                  Continue
                </CustomButton>
              </div>
            </>
          ) : null}

          {draft.step === 4 ? (
            <>
              <div className="space-y-2">
                <h3 className="text-3xl font-semibold">
                  Great! Let&apos;s get started.
                </h3>
              </div>

              <div className="flex w-full flex-col gap-4">
                {draft.type === 'individual' ? (
                  <>
                    <FormInput
                      label="First Name"
                      placeholder="First Name"
                      value={draft.firstName}
                      onChange={(event) =>
                        updateDraft({ firstName: event.target.value })
                      }
                    />
                    <FormInput
                      label="Last Name"
                      placeholder="Last Name"
                      value={draft.lastName}
                      onChange={(event) =>
                        updateDraft({ lastName: event.target.value })
                      }
                    />
                  </>
                ) : (
                  <>
                    <FormInput
                      label="Contact Full Name"
                      placeholder="Contact Full Name"
                      value={draft.contactFullName}
                      onChange={(event) =>
                        updateDraft({ contactFullName: event.target.value })
                      }
                    />
                    <FormInput
                      label="Company Name"
                      placeholder="Company Name"
                      value={draft.organizationName}
                      onChange={(event) =>
                        updateDraft({ organizationName: event.target.value })
                      }
                    />
                  </>
                )}
                <FormInput
                  label="Phone Number"
                  placeholder="Phone Number"
                  type="tel"
                  value={draft.phoneNumber}
                  onChange={(event) =>
                    updateDraft({ phoneNumber: event.target.value })
                  }
                />
              </div>

              {currentError ? (
                <p className="text-sm text-red-400">{currentError}</p>
              ) : null}

              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <CustomButton
                  variant="outlined"
                  className="w-full px-6 py-3 text-base sm:w-1/2"
                  onClick={() => updateDraft({ step: 3 })}
                  disabled={isSubmitting}
                >
                  Back
                </CustomButton>
                <CustomButton
                  className="w-full px-6 py-3 text-base sm:w-1/2"
                  onClick={handleStep4Continue}
                  disabled={
                    isSubmitting ||
                    (draft.type === 'individual'
                      ? !draft.firstName.trim() || !draft.lastName.trim()
                      : !hasFullContactName || !draft.organizationName.trim())
                  }
                >
                  {isSubmitting ? 'Continuing...' : 'Continue'}
                </CustomButton>
              </div>
            </>
          ) : null}

          {draft.step === 5 ? (
            <>
              <div className="space-y-2">
                <h3 className="text-3xl font-semibold">
                  Let&apos;s create your account!
                </h3>
              </div>

              <div className="flex w-full flex-col gap-4">
                <FormInput
                  label="Email"
                  placeholder="Email"
                  type="email"
                  value={draft.email}
                  onChange={(event) =>
                    updateDraft({ email: event.target.value })
                  }
                />

                <div className="flex items-start gap-3">
                  <CustomCheckbox
                    checked={draft.agreedToTerms}
                    onToggle={() =>
                      updateDraft({ agreedToTerms: !draft.agreedToTerms })
                    }
                    className="mt-0.5 h-6 w-6 shrink-0"
                  />
                  <p className="text-sm text-gray-300">
                    By creating an account, I agree to infrafund&apos;s{' '}
                    <span className="text-primary underline">
                      Terms of Service
                    </span>{' '}
                    and{' '}
                    <span className="text-primary underline">
                      Privacy Notice
                    </span>
                    .
                  </p>
                </div>
              </div>

              {currentError ? (
                <p className="text-sm text-red-400">{currentError}</p>
              ) : null}

              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <CustomButton
                  variant="outlined"
                  className="w-full px-6 py-3 text-base sm:w-1/2"
                  onClick={() => updateDraft({ step: 4 })}
                  disabled={isSubmitting}
                >
                  Back
                </CustomButton>
                <CustomButton
                  className="w-full px-6 py-3 text-base sm:w-1/2"
                  onClick={handleQualificationSubmit}
                  disabled={
                    isSubmitting ||
                    !EMAIL_REGEX.test(draft.email.trim()) ||
                    !draft.agreedToTerms
                  }
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
