import 'server-only';

import type {
  ProjectInfrastructureType,
  ProjectStatus,
  UserRole,
} from '@prisma/client';

import {
  addFieldError,
  readBoolean,
  readDate,
  readDecimalString,
  readJsonObject,
  readOptionalUrl,
  readString,
  readStringArray,
  throwIfFieldErrors,
  type JsonObject,
} from '@/server/validation/kernel';

const infrastructureTypes = new Set<ProjectInfrastructureType>([
  'wind_energy',
  'solar_power',
  'hydroelectric',
  'geothermal',
  'nuclear',
  'other',
]);
// Project-level roles a member can be invited into. project_owner is the
// creator's role, not something invited; admin/moderator/support are
// platform-staff roles unrelated to project membership.
const invitableRoles = new Set<UserRole>([
  'investor',
  'contractor',
  'governance',
  'auditor',
]);
const projectStatuses = new Set<ProjectStatus>([
  'planning',
  'in_development',
  'ready_to_launch',
  'on_hold',
  'completed',
]);

export interface ContactInput {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  phoneNumber?: string;
}

interface ProposalDocumentInput {
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  checksum?: string;
  storageUrl?: string;
}

export interface ProjectInformationInput {
  name: string;
  description: string;
  targetInvestmentAmount: string;
  infrastructureType: ProjectInfrastructureType;
  projectStatus: ProjectStatus;
  raisedBefore: boolean;
  websiteUrl?: string;
  socialUrl?: string;
  proposalDocument?: ProposalDocumentInput;
}

interface CampaignMilestoneInput {
  name: string;
  cost?: string;
  endDate?: Date;
  componentExternalIds: string[];
}

export interface MilestonesInput {
  milestones: CampaignMilestoneInput[];
}

export interface InviteMemberInput {
  email: string;
  role: UserRole;
}

export interface CampaignInput {
  tokenName: string;
  digitalAssetSupply: string;
  price: string;
  currency: string;
  minRaise: string;
  maxRaise: string;
  minContribution: string;
  maxContribution: string;
  startDate: Date;
  endDate: Date;
  generalContractorWalletAddress?: string;
  pledgeAddress?: string;
}

export async function parseProjectContactRequest(request: Request) {
  const body = await readJsonObject(request);
  const fields: Record<string, string> = {};
  const firstName = readString(body, fields, 'first_name', {
    required: true,
    maxLength: 100,
  });
  const lastName = readString(body, fields, 'last_name', {
    required: true,
    maxLength: 100,
  });
  const email = readString(body, fields, 'email', {
    required: true,
    maxLength: 255,
    email: true,
  });
  const title = readString(body, fields, 'title', {
    required: true,
    maxLength: 120,
  });
  const phoneNumber = readString(body, fields, 'phone_number', {
    maxLength: 30,
  });

  throwIfFieldErrors(fields);

  return {
    firstName: firstName!,
    lastName: lastName!,
    email: email!,
    title: title!,
    phoneNumber,
  } satisfies ContactInput;
}

export async function parseProjectInformationRequest(request: Request) {
  const body = await readJsonObject(request);
  const fields: Record<string, string> = {};
  const name = readString(body, fields, 'name', {
    required: true,
    maxLength: 255,
  });
  const description = readString(body, fields, 'description', {
    required: true,
    maxLength: 5000,
  });
  const targetInvestmentAmount = readDecimalString(
    body,
    fields,
    'target_investment_amount',
    { required: true }
  );
  const infrastructureType = readString(body, fields, 'infrastructure_type', {
    required: true,
  });
  const projectStatus = readString(body, fields, 'project_status', {
    required: true,
  });
  const raisedBefore = readBoolean(body, fields, 'raised_before');
  const websiteUrl = readOptionalUrl(body, fields, 'website_url');
  const socialUrl = readOptionalUrl(body, fields, 'social_url');
  const proposalDocument = parseProposalDocument(body, fields);

  if (
    infrastructureType &&
    !infrastructureTypes.has(infrastructureType as ProjectInfrastructureType)
  ) {
    addFieldError(fields, 'infrastructure_type', 'Invalid infrastructure_type');
  }

  if (projectStatus && !projectStatuses.has(projectStatus as ProjectStatus)) {
    addFieldError(fields, 'project_status', 'Invalid project_status');
  }

  throwIfFieldErrors(fields);

  return {
    name: name!,
    description: description!,
    targetInvestmentAmount: targetInvestmentAmount!,
    infrastructureType: infrastructureType as ProjectInfrastructureType,
    projectStatus: projectStatus as ProjectStatus,
    raisedBefore,
    websiteUrl,
    socialUrl,
    proposalDocument,
  } satisfies ProjectInformationInput;
}

function parseProposalDocument(
  body: JsonObject,
  fields: Record<string, string>
) {
  const value = body.proposal_document;

  if (value === undefined || value === null) return undefined;

  if (typeof value !== 'object' || Array.isArray(value)) {
    addFieldError(
      fields,
      'proposal_document',
      'proposal_document must be an object'
    );
    return undefined;
  }

  const document = value as JsonObject;
  const fileName = readString(document, fields, 'file_name', {
    maxLength: 255,
  });
  const mimeType = readString(document, fields, 'mime_type', {
    maxLength: 100,
  });
  const checksum = readString(document, fields, 'checksum', {
    maxLength: 128,
  });
  const storageUrl = readOptionalUrl(document, fields, 'storage_url');

  if (fields.storage_url) {
    fields.proposal_document = fields.storage_url;
    delete fields.storage_url;
  }
  const sizeBytes = document.size_bytes;

  if (
    sizeBytes !== undefined &&
    (!Number.isInteger(sizeBytes) || (sizeBytes as number) <= 0)
  ) {
    addFieldError(
      fields,
      'size_bytes',
      'size_bytes must be a positive integer'
    );
  }

  return {
    fileName,
    mimeType,
    checksum,
    storageUrl,
    sizeBytes: typeof sizeBytes === 'number' ? sizeBytes : undefined,
  } satisfies ProposalDocumentInput;
}

export async function parseCampaignRequest(request: Request) {
  const body = await readJsonObject(request);
  const fields: Record<string, string> = {};
  const tokenName = readString(body, fields, 'token_name', {
    required: true,
    maxLength: 120,
  });
  const digitalAssetSupply = readDecimalString(
    body,
    fields,
    'digital_asset_supply',
    { required: true }
  );
  const price = readDecimalString(body, fields, 'price', { required: true });
  const currency =
    readString(body, fields, 'currency', { maxLength: 12 }) ?? 'USDC';
  const minRaise = readDecimalString(body, fields, 'min_raise', {
    required: true,
  });
  const maxRaise = readDecimalString(body, fields, 'max_raise', {
    required: true,
  });
  const minContribution = readDecimalString(body, fields, 'min_contribution', {
    required: true,
  });
  const maxContribution = readDecimalString(body, fields, 'max_contribution', {
    required: true,
  });
  const startDate = readDate(body, fields, 'start_date', { required: true });
  const endDate = readDate(body, fields, 'end_date', { required: true });
  const generalContractorWalletAddress = readString(
    body,
    fields,
    'general_contractor_wallet_address',
    { maxLength: 255 }
  );
  const pledgeAddress = readString(body, fields, 'pledge_address', {
    maxLength: 255,
  });

  if (startDate && endDate && startDate >= endDate) {
    addFieldError(fields, 'end_date', 'end_date must be after start_date');
  }

  if (minRaise && maxRaise && Number(minRaise) > Number(maxRaise)) {
    addFieldError(
      fields,
      'max_raise',
      'max_raise must be greater than min_raise'
    );
  }

  if (
    minContribution &&
    maxContribution &&
    Number(minContribution) > Number(maxContribution)
  ) {
    addFieldError(
      fields,
      'max_contribution',
      'max_contribution must be greater than min_contribution'
    );
  }

  throwIfFieldErrors(fields);

  return {
    tokenName: tokenName!,
    digitalAssetSupply: digitalAssetSupply!,
    price: price!,
    currency: currency.toUpperCase(),
    minRaise: minRaise!,
    maxRaise: maxRaise!,
    minContribution: minContribution!,
    maxContribution: maxContribution!,
    startDate: startDate!,
    endDate: endDate!,
    generalContractorWalletAddress,
    pledgeAddress,
  } satisfies CampaignInput;
}

export async function parseMilestonesRequest(request: Request) {
  const body = await readJsonObject(request);
  const fields: Record<string, string> = {};
  const milestones = parseMilestones(body, fields);

  throwIfFieldErrors(fields);

  return { milestones } satisfies MilestonesInput;
}

function parseMilestones(body: JsonObject, fields: Record<string, string>) {
  const value = body.milestones;

  if (!Array.isArray(value) || value.length === 0) {
    addFieldError(fields, 'milestones', 'At least one milestone is required');
    return [];
  }

  return value.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      addFieldError(
        fields,
        `milestones.${index}`,
        'Milestone must be an object'
      );
      return { name: '', componentExternalIds: [] };
    }

    const milestone = item as JsonObject;
    const name = readString(milestone, fields, 'name', {
      required: true,
      maxLength: 180,
    });
    const cost = readDecimalString(milestone, fields, 'cost');
    const endDate = readDate(milestone, fields, 'end_date');
    const componentExternalIds = readStringArray(
      milestone,
      fields,
      'component_external_ids',
      {
        maxLength: 20,
        itemMaxLength: 120,
      }
    );

    if (fields.name) {
      fields[`milestones.${index}.name`] = fields.name;
      delete fields.name;
    }

    if (fields.cost) {
      fields[`milestones.${index}.cost`] = fields.cost;
      delete fields.cost;
    }

    if (fields.end_date) {
      fields[`milestones.${index}.end_date`] = fields.end_date;
      delete fields.end_date;
    }

    if (fields.component_external_ids) {
      fields[`milestones.${index}.component_external_ids`] =
        fields.component_external_ids;
      delete fields.component_external_ids;
    }

    return {
      name: name ?? '',
      cost,
      endDate,
      componentExternalIds,
    };
  });
}

export async function parseInviteMemberRequest(request: Request) {
  const body = await readJsonObject(request);
  const fields: Record<string, string> = {};
  const email = readString(body, fields, 'email', {
    required: true,
    maxLength: 255,
    email: true,
  });
  const role = readString(body, fields, 'role', { required: true });

  if (role && !invitableRoles.has(role as UserRole)) {
    addFieldError(
      fields,
      'role',
      `role must be one of ${Array.from(invitableRoles).join(', ')}`
    );
  }

  throwIfFieldErrors(fields);

  return {
    email: email!,
    role: role as UserRole,
  } satisfies InviteMemberInput;
}
