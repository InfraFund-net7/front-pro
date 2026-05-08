'use client';

import CardView from '@/components/ui/card-view';
import { FormInput } from '@/components/ui/form-input';
import { useAuthSession } from '@/components/auth/auth-session-provider';

const ROLE_LABELS: Record<string, string> = {
  investor: 'Investor',
  contractor: 'Contractor',
  client: 'Project Developer',
  dao: 'Governance Member',
};

function formatRoleLabel(role: string | null | undefined): string {
  const normalized = (role ?? '').trim().toLowerCase();
  if (!normalized) return 'Member';
  if (ROLE_LABELS[normalized]) return ROLE_LABELS[normalized];
  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

export function RoleAccess() {
  const { backendUser } = useAuthSession();
  const roleLabel = formatRoleLabel(backendUser?.role);
  const userType = backendUser?.type ?? '';

  return (
    <div className="w-full h-fit flex justify-between items-center gap-4">
      <CardView className="w-fit h-67.5 rounded-xl gap-6 flex flex-col p-5.75">
        <h2 className="text-2xl text-heading-text font-semibold text-start">
          Platform Role &amp; Access
        </h2>
        <div className="w-full flex justify-between items-center gap-5">
          <div className="w-30.5 h-30.5 rounded-xl bg-[#63A8FF]" />
          <div className="flex flex-col justify-center items-start gap-4">
            <h3 className="text-base text-gray-50 font-medium">
              {roleLabel} Role Badge
            </h3>
            {/* TODO(task-113-followup): show real Role NFT token id + chain
                once the on-chain role-NFT model exists. */}
            <p className="text-sm text-gray-300 font-medium">
              Access granted via your platform role.
            </p>
          </div>
        </div>
        <span className="text-sm text-gray-700 font-normal text-center w-full">
          Your role determines your access level and permissions within the
          InfraFund platform.
        </span>
      </CardView>
      <CardView className="w-fit h-67.5 rounded-xl p-7 flex flex-col gap-6">
        <h2 className="text-2xl text-heading-text font-semibold text-start">
          Investor Profile
        </h2>
        <div className="flex flex-col justify-between items-center gap-6 w-full">
          {/* User type comes from BackendMeResponse.type and is read-only here. */}
          <FormInput
            label="User Type"
            disabled
            value={userType}
            placeholder="—"
            className="w-full"
          />
          {/* TODO(task-113-followup): tax id / national insurance number is
              not in BackendMeResponse yet; placeholder until the data model
              and PUT /api/v1/account/me endpoint exist. */}
          <FormInput
            label="Tax ID / National Insurance No."
            disabled
            value=""
            placeholder="—"
            className="w-full"
          />
        </div>
      </CardView>
    </div>
  );
}
