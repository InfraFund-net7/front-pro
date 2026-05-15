import 'server-only';

import type { ProjectInfrastructureType, ProjectStatus } from '@prisma/client';

import { ApiError } from '@/server/http';
import { readJsonObject } from '@/server/validation/public-forms';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlPattern = /^https?:\/\/.+/i;
const infrastructureTypes = new Set<ProjectInfrastructureType>([
  'wind_energy',
  'solar_power',
  'hydroelectric',
  'geothermal',
  'nuclear',
  'other',
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

type JsonObject = Record<string, unknown>;

function addFieldError(
  fields: Record<string, string>,
  field: string,
  message: string
) {
  fields[field] ??= message;
}

function throwIfFieldErrors(fields: Record<string, string>) {
  if (Object.keys(fields).length > 0) {
    throw new ApiError('VALIDATION_ERROR', 'Validation failed', { fields });
  }
}

function readString(
  body: JsonObject,
  fields: Record<string, string>,
  field: string,
  options: { required?: boolean; maxLength?: number; email?: boolean } = {}
) {
  const value = body[field];

  if (value === undefined || value === null) {
    if (options.required) addFieldError(fields, field, `${field} is required`);
    return undefined;
  }

  if (typeof value !== 'string') {
    addFieldError(fields, field, `${field} must be a string`);
    return undefined;
  }

  const trimmed = value.trim();

  if (options.required && !trimmed) {
    addFieldError(fields, field, `${field} is required`);
  }

  if (options.maxLength && trimmed.length > options.maxLength) {
    addFieldError(
      fields,
      field,
      `${field} must be at most ${options.maxLength} characters`
    );
  }

  if (options.email && trimmed && !emailPattern.test(trimmed)) {
    addFieldError(fields, field, `${field} must be a valid email address`);
  }

  return trimmed || undefined;
}

function readDecimalString(
  body: JsonObject,
  fields: Record<string, string>,
  field: string,
  options: { required?: boolean } = {}
) {
  const value = readString(body, fields, field, options);

  if (!value) return undefined;

  const normalized = value.replace(/,/g, '');

  if (!/^\d+(\.\d+)?$/.test(normalized) || Number(normalized) <= 0) {
    addFieldError(fields, field, `${field} must be a positive number`);
  }

  return normalized;
}

function readBoolean(
  body: JsonObject,
  fields: Record<string, string>,
  field: string
) {
  const value = body[field];

  if (typeof value !== 'boolean') {
    addFieldError(fields, field, `${field} must be true or false`);
    return false;
  }

  return value;
}

function readDate(
  body: JsonObject,
  fields: Record<string, string>,
  field: string,
  options: { required?: boolean } = {}
) {
  const value = readString(body, fields, field, options);

  if (!value) return undefined;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    addFieldError(fields, field, `${field} must be a valid date`);
  }

  return date;
}

function readOptionalUrl(
  body: JsonObject,
  fields: Record<string, string>,
  field: string
) {
  const value = readString(body, fields, field, { maxLength: 2048 });

  if (value && !urlPattern.test(value)) {
    addFieldError(fields, field, `${field} must be a valid URL`);
  }

  return value;
}

function readStringFromObject(
  body: JsonObject,
  fields: Record<string, string>,
  field: string,
  options: { maxLength?: number } = {}
) {
  return readString(body, fields, field, options);
}

function readStringArrayFromObject(
  body: JsonObject,
  fields: Record<string, string>,
  field: string,
  options: {
    required?: boolean;
    maxLength?: number;
    itemMaxLength?: number;
  } = {}
) {
  const value = body[field];

  if (value === undefined || value === null) {
    if (options.required) {
      addFieldError(fields, field, `${field} is required`);
    }
    return [];
  }

  if (!Array.isArray(value)) {
    addFieldError(fields, field, `${field} must be an array`);
    return [];
  }

  if (options.maxLength !== undefined && value.length > options.maxLength) {
    addFieldError(
      fields,
      field,
      `${field} must contain at most ${options.maxLength} items`
    );
  }

  return value.flatMap((item, index) => {
    if (typeof item !== 'string') {
      addFieldError(
        fields,
        `${field}.${index}`,
        `${field}.${index} must be a string`
      );
      return [];
    }

    const trimmed = item.trim();

    if (!trimmed) {
      addFieldError(
        fields,
        `${field}.${index}`,
        `${field}.${index} is required`
      );
      return [];
    }

    if (options.itemMaxLength && trimmed.length > options.itemMaxLength) {
      addFieldError(
        fields,
        `${field}.${index}`,
        `${field}.${index} must be at most ${options.itemMaxLength} characters`
      );
      return [];
    }

    return [trimmed];
  });
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
  const fileName = readStringFromObject(document, fields, 'file_name', {
    maxLength: 255,
  });
  const mimeType = readStringFromObject(document, fields, 'mime_type', {
    maxLength: 100,
  });
  const checksum = readStringFromObject(document, fields, 'checksum', {
    maxLength: 128,
  });
  const storageUrl = readOptionalUrl(document, fields, 'storage_url');
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
    const componentExternalIds = readStringArrayFromObject(
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
