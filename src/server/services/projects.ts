import 'server-only';

import { isUniqueConstraintError } from '@/server/repositories/shared';
import { ApiError } from '@/server/http';
import {
  addProjectMember,
  createProjectDraft,
  findProjectForOwner,
  findProjectsForAccount,
  removeProjectMember,
  replaceProjectMilestones,
  submitProject,
  updateProjectInformation,
  upsertProjectCampaign,
  upsertProjectContact,
  type ProjectWithDetails,
} from '@/server/repositories/projects';
import { findUserByEmail } from '@/server/repositories/users';
import { serializeDate, serializeDecimal } from '@/server/serialization';
import { authenticateAppRequest } from '@/server/services/auth';
import type {
  CampaignInput,
  ContactInput,
  InviteMemberInput,
  MilestonesInput,
  ProjectInformationInput,
} from '@/server/validation/projects';

async function getAuthenticatedProjectOwner(accessToken: string) {
  const { user } = await authenticateAppRequest(accessToken);

  if (user.role !== 'project_owner') {
    throw new ApiError('FORBIDDEN', 'Project owner account required.');
  }

  return user;
}

async function getAuthenticatedProjectOwnerId(accessToken: string) {
  const user = await getAuthenticatedProjectOwner(accessToken);

  return user.id;
}

async function assertProjectOwner(projectId: string, accessToken: string) {
  const ownerUserId = await getAuthenticatedProjectOwnerId(accessToken);
  const project = await findProjectForOwner(projectId, ownerUserId);

  if (!project) {
    throw new ApiError('NOT_FOUND', 'Project not found.');
  }

  return project;
}

function serializeProject(
  project: ProjectWithDetails,
  options: { currentUserId?: string } = {}
) {
  const accountRoles = options.currentUserId
    ? project.accountRoles
        .filter((accountRole) => accountRole.userId === options.currentUserId)
        .map((accountRole) => accountRole.role)
    : project.accountRoles.map((accountRole) => accountRole.role);

  return {
    id: project.id,
    owner_user_id: project.ownerUserId,
    name: project.name,
    description: project.description,
    type: project.type,
    infrastructure_type: project.infrastructureType,
    project_status: project.projectStatus,
    crowdfunding_model: project.crowdfundingModel,
    submission_status: project.submissionStatus,
    current_step: project.currentStep,
    digital_asset_symbol: project.digitalAssetSymbol,
    target_investment_amount: serializeDecimal(project.targetInvestmentAmount),
    target_investment_currency: project.targetInvestmentCurrency,
    raised_before: project.raisedBefore,
    website_url: project.websiteUrl,
    social_url: project.socialUrl,
    submitted_at: serializeDate(project.submittedAt),
    created_at: project.createdAt.toISOString(),
    updated_at: project.updatedAt.toISOString(),
    account_roles: accountRoles,
    members: project.accountRoles.map((accountRole) => ({
      user_id: accountRole.userId,
      role: accountRole.role,
      email: accountRole.user.email,
      first_name: accountRole.user.firstName,
      last_name: accountRole.user.lastName,
    })),
    contact: project.contact
      ? {
          first_name: project.contact.firstName,
          last_name: project.contact.lastName,
          email: project.contact.email,
          title: project.contact.title,
          phone_number: project.contact.phoneNumber,
        }
      : null,
    campaign: project.campaign
      ? {
          token_name: project.campaign.tokenName,
          digital_asset_supply: serializeDecimal(
            project.campaign.digitalAssetSupply
          ),
          price: serializeDecimal(project.campaign.price),
          currency: project.campaign.currency,
          min_raise: serializeDecimal(project.campaign.minRaise),
          max_raise: serializeDecimal(project.campaign.maxRaise),
          min_contribution: serializeDecimal(project.campaign.minContribution),
          max_contribution: serializeDecimal(project.campaign.maxContribution),
          start_date: serializeDate(project.campaign.startDate),
          end_date: serializeDate(project.campaign.endDate),
          general_contractor_wallet_address:
            project.campaign.generalContractorWalletAddress,
          pledge_address: project.campaign.pledgeAddress,
        }
      : null,
    documents: project.documents.map((document) => ({
      id: document.id,
      kind: document.kind,
      file_name: document.fileName,
      mime_type: document.mimeType,
      size_bytes: document.sizeBytes,
      checksum: document.checksum,
      storage_url: document.storageUrl,
    })),
    digital_twin_model: project.digitalTwinModels[0]
      ? {
          id: project.digitalTwinModels[0].id,
          name: project.digitalTwinModels[0].name,
          asset_url: project.digitalTwinModels[0].assetUrl,
          format: project.digitalTwinModels[0].format,
          source: project.digitalTwinModels[0].source,
          components: project.digitalTwinModels[0].components.map(
            (component) => ({
              id: component.id,
              external_id: component.externalId,
              display_name: component.displayName,
              node_name: component.nodeName,
              category: component.category,
              sort_order: component.sortOrder,
              is_visible: component.isVisible,
            })
          ),
        }
      : null,
    milestones: project.milestones.map((milestone) => ({
      id: milestone.id,
      name: milestone.name,
      cost: serializeDecimal(milestone.cost),
      end_date: serializeDate(milestone.endDate),
      sort_order: milestone.sortOrder,
      components: milestone.components.map((mapping) => ({
        id: mapping.component.id,
        external_id: mapping.component.externalId,
        display_name: mapping.component.displayName,
        node_name: mapping.component.nodeName,
        category: mapping.component.category,
        sort_order: mapping.sortOrder,
        is_visible: mapping.component.isVisible,
      })),
    })),
  };
}

export async function createPreSaleProjectDraft(accessToken: string) {
  const owner = await getAuthenticatedProjectOwner(accessToken);
  const project = await createProjectDraft(owner.id, owner.role);

  return serializeProject(project, { currentUserId: owner.id });
}

export async function listMyProjects(accessToken: string) {
  const { user } = await authenticateAppRequest(accessToken);
  const projects = await findProjectsForAccount(user.id);

  return {
    items: projects.map((project) =>
      serializeProject(project, { currentUserId: user.id })
    ),
  };
}

export async function getProject(accessToken: string, projectId: string) {
  const project = await assertProjectOwner(projectId, accessToken);

  return serializeProject(project);
}

export async function saveProjectContact(
  accessToken: string,
  projectId: string,
  input: ContactInput
) {
  await assertProjectOwner(projectId, accessToken);
  const project = await upsertProjectContact(projectId, input);

  return serializeProject(project);
}

export async function saveProjectInformation(
  accessToken: string,
  projectId: string,
  input: ProjectInformationInput
) {
  await assertProjectOwner(projectId, accessToken);
  const project = await updateProjectInformation(projectId, input);

  return serializeProject(project);
}

export async function saveProjectMilestones(
  accessToken: string,
  projectId: string,
  input: MilestonesInput
) {
  await assertProjectOwner(projectId, accessToken);
  const project = await replaceProjectMilestones(projectId, input);

  return serializeProject(project);
}

export async function saveProjectCampaign(
  accessToken: string,
  projectId: string,
  input: CampaignInput
) {
  await assertProjectOwner(projectId, accessToken);
  const project = await upsertProjectCampaign(projectId, input);

  return serializeProject(project);
}

export async function submitProjectDraft(
  accessToken: string,
  projectId: string
) {
  const existing = await assertProjectOwner(projectId, accessToken);

  if (existing.submissionStatus === 'submitted') {
    throw new ApiError('CONFLICT', 'Project has already been submitted.');
  }

  if (
    !existing.contact ||
    !existing.campaign ||
    !existing.name ||
    existing.milestones.length === 0
  ) {
    throw new ApiError(
      'VALIDATION_ERROR',
      'Project draft is incomplete before submission.'
    );
  }

  const project = await submitProject(projectId);

  return serializeProject(project);
}

export async function inviteProjectMember(
  accessToken: string,
  projectId: string,
  input: InviteMemberInput
) {
  await assertProjectOwner(projectId, accessToken);

  const invitee = await findUserByEmail(input.email);

  if (!invitee) {
    throw new ApiError(
      'NOT_FOUND',
      'No InfraFund account found for that email.'
    );
  }

  try {
    const project = await addProjectMember(projectId, invitee.id, input.role);

    return serializeProject(project);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError(
        'CONFLICT',
        'This person already has that role on the project.'
      );
    }

    throw error;
  }
}

export async function removeMemberFromProject(
  accessToken: string,
  projectId: string,
  memberUserId: string
) {
  const existing = await assertProjectOwner(projectId, accessToken);

  if (memberUserId === existing.ownerUserId) {
    throw new ApiError(
      'BAD_REQUEST',
      'The project owner cannot be removed as a member.'
    );
  }

  const project = await removeProjectMember(projectId, memberUserId);

  return serializeProject(project);
}
