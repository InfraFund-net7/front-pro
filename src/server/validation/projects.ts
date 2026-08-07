import 'server-only';

import { z } from 'zod';
import type { ProjectInfrastructureType, ProjectStatus } from '@prisma/client';

import { parseRequestBody } from '@/server/validation/http';

const urlPattern = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(?:[/?#:].*)?$/i;
const decimalPattern = /^\d+(\.\d+)?$/;

const infrastructureTypes = [
  'wind_energy',
  'solar_power',
  'hydroelectric',
  'geothermal',
  'nuclear',
  'other',
] as const satisfies readonly ProjectInfrastructureType[];
const projectStatuses = [
  'planning',
  'in_development',
  'ready_to_launch',
  'on_hold',
  'completed',
] as const satisfies readonly ProjectStatus[];

// CreateProject.tsx sends '' for untouched optional fields rather than
// omitting the key or sending null -- treat that the same as absent.
function emptyToUndefined(value: unknown) {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

function requiredString(maxLength: number) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).max(maxLength)
  );
}

function optionalString(maxLength: number) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().max(maxLength).optional()
  );
}

function decimalStringBase(field: string) {
  return z
    .string()
    .trim()
    .transform((val) => val.replace(/,/g, ''))
    .refine((val) => decimalPattern.test(val) && Number(val) > 0, {
      message: `${field} must be a positive number`,
    });
}

function requiredDecimalString(field: string) {
  return z.preprocess(emptyToUndefined, decimalStringBase(field));
}

function optionalDecimalString(field: string) {
  return z.preprocess(emptyToUndefined, decimalStringBase(field).optional());
}

function dateStringBase(field: string) {
  return z.string().transform((val, ctx) => {
    const date = new Date(val);

    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({
        code: 'custom',
        message: `${field} must be a valid date`,
      });
      return z.NEVER;
    }

    return date;
  });
}

function requiredDateString(field: string) {
  return z.preprocess(emptyToUndefined, dateStringBase(field));
}

function optionalDateString(field: string) {
  return z.preprocess(emptyToUndefined, dateStringBase(field).optional());
}

function optionalUrl(field: string) {
  return z.preprocess(
    emptyToUndefined,
    z
      .string()
      .max(2048, `${field} must be at most 2048 characters`)
      .refine((val) => urlPattern.test(val), {
        message: `${field} must be a valid URL`,
      })
      .transform((val) => (/^https?:\/\//i.test(val) ? val : `https://${val}`))
      .optional()
  );
}

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

const contactSchema = z.object({
  first_name: requiredString(100),
  last_name: requiredString(100),
  email: requiredString(255).pipe(
    z.email('email must be a valid email address')
  ),
  title: requiredString(120),
  phone_number: optionalString(30),
});

export async function parseProjectContactRequest(
  request: Request
): Promise<ContactInput> {
  const body = await parseRequestBody(request, contactSchema);

  return {
    firstName: body.first_name,
    lastName: body.last_name,
    email: body.email,
    title: body.title,
    phoneNumber: body.phone_number,
  };
}

const proposalDocumentSchema = z
  .object({
    file_name: optionalString(255),
    mime_type: optionalString(100),
    checksum: optionalString(128),
    storage_url: optionalUrl('proposal_document'),
    size_bytes: z.number().int().positive().optional(),
  })
  .optional();

const informationSchema = z.object({
  name: requiredString(255),
  description: requiredString(5000),
  target_investment_amount: requiredDecimalString('target_investment_amount'),
  infrastructure_type: z.enum(
    infrastructureTypes,
    'Invalid infrastructure_type'
  ),
  project_status: z.enum(projectStatuses, 'Invalid project_status'),
  raised_before: z.boolean(),
  website_url: optionalUrl('website_url'),
  social_url: optionalUrl('social_url'),
  proposal_document: proposalDocumentSchema,
});

export async function parseProjectInformationRequest(
  request: Request
): Promise<ProjectInformationInput> {
  const body = await parseRequestBody(request, informationSchema);

  return {
    name: body.name,
    description: body.description,
    targetInvestmentAmount: body.target_investment_amount,
    infrastructureType: body.infrastructure_type,
    projectStatus: body.project_status,
    raisedBefore: body.raised_before,
    websiteUrl: body.website_url,
    socialUrl: body.social_url,
    proposalDocument: body.proposal_document
      ? {
          fileName: body.proposal_document.file_name,
          mimeType: body.proposal_document.mime_type,
          checksum: body.proposal_document.checksum,
          storageUrl: body.proposal_document.storage_url,
          sizeBytes: body.proposal_document.size_bytes,
        }
      : undefined,
  };
}

const campaignSchema = z
  .object({
    token_name: requiredString(120),
    digital_asset_supply: requiredDecimalString('digital_asset_supply'),
    price: requiredDecimalString('price'),
    currency: optionalString(12),
    min_raise: requiredDecimalString('min_raise'),
    max_raise: requiredDecimalString('max_raise'),
    min_contribution: requiredDecimalString('min_contribution'),
    max_contribution: requiredDecimalString('max_contribution'),
    start_date: requiredDateString('start_date'),
    end_date: requiredDateString('end_date'),
    general_contractor_wallet_address: optionalString(255),
    pledge_address: optionalString(255),
  })
  .check((ctx) => {
    const {
      start_date,
      end_date,
      min_raise,
      max_raise,
      min_contribution,
      max_contribution,
    } = ctx.value;

    if (start_date >= end_date) {
      ctx.issues.push({
        code: 'custom',
        message: 'end_date must be after start_date',
        path: ['end_date'],
        input: ctx.value,
      });
    }

    if (Number(min_raise) > Number(max_raise)) {
      ctx.issues.push({
        code: 'custom',
        message: 'max_raise must be greater than min_raise',
        path: ['max_raise'],
        input: ctx.value,
      });
    }

    if (Number(min_contribution) > Number(max_contribution)) {
      ctx.issues.push({
        code: 'custom',
        message: 'max_contribution must be greater than min_contribution',
        path: ['max_contribution'],
        input: ctx.value,
      });
    }
  });

export async function parseCampaignRequest(
  request: Request
): Promise<CampaignInput> {
  const body = await parseRequestBody(request, campaignSchema);

  return {
    tokenName: body.token_name,
    digitalAssetSupply: body.digital_asset_supply,
    price: body.price,
    currency: (body.currency ?? 'USDC').toUpperCase(),
    minRaise: body.min_raise,
    maxRaise: body.max_raise,
    minContribution: body.min_contribution,
    maxContribution: body.max_contribution,
    startDate: body.start_date,
    endDate: body.end_date,
    generalContractorWalletAddress: body.general_contractor_wallet_address,
    pledgeAddress: body.pledge_address,
  };
}

const milestoneSchema = z.object({
  name: requiredString(180),
  cost: optionalDecimalString('cost'),
  end_date: optionalDateString('end_date'),
  component_external_ids: z
    .array(z.string().trim().min(1).max(120))
    .max(20)
    .optional()
    .default([]),
});

const milestonesSchema = z.object({
  milestones: z
    .array(milestoneSchema)
    .min(1, 'At least one milestone is required'),
});

export async function parseMilestonesRequest(
  request: Request
): Promise<MilestonesInput> {
  const body = await parseRequestBody(request, milestonesSchema);

  return {
    milestones: body.milestones.map((milestone) => ({
      name: milestone.name,
      cost: milestone.cost,
      endDate: milestone.end_date,
      componentExternalIds: milestone.component_external_ids,
    })),
  };
}
