import 'server-only';

import { Prisma } from '@prisma/client';

import { getDb } from '@/server/db';
import type {
  CampaignInput,
  ContactInput,
  MilestonesInput,
  ProjectInformationInput,
} from '@/server/validation/projects';

const projectInclude = {
  campaign: true,
  contact: true,
  documents: true,
  milestones: {
    orderBy: {
      sortOrder: 'asc' as const,
    },
  },
} satisfies Prisma.ProjectInclude;

export type ProjectWithDetails = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

export function createProjectDraft(ownerUserId: string) {
  return getDb().project.create({
    data: {
      ownerUserId,
      crowdfundingModel: 'pre_sale',
      currentStep: 'contact_information',
    },
    include: projectInclude,
  });
}

export function findProjectForOwner(projectId: string, ownerUserId: string) {
  return getDb().project.findFirst({
    where: {
      id: projectId,
      ownerUserId,
    },
    include: projectInclude,
  });
}

export function upsertProjectContact(projectId: string, input: ContactInput) {
  const now = new Date();

  return getDb().project.update({
    where: {
      id: projectId,
    },
    data: {
      currentStep: 'project_information',
      updatedAt: now,
      contact: {
        upsert: {
          create: {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            title: input.title,
            phoneNumber: input.phoneNumber,
            updatedAt: now,
          },
          update: {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            title: input.title,
            phoneNumber: input.phoneNumber,
            updatedAt: now,
          },
        },
      },
    },
    include: projectInclude,
  });
}

export function updateProjectInformation(
  projectId: string,
  input: ProjectInformationInput
) {
  const now = new Date();

  return getDb().project.update({
    where: {
      id: projectId,
    },
    data: {
      name: input.name,
      description: input.description,
      type: 'renewable_energy',
      infrastructureType: input.infrastructureType,
      projectStatus: input.projectStatus,
      targetInvestmentAmount: input.targetInvestmentAmount,
      targetInvestmentCurrency: 'GBP',
      raisedBefore: input.raisedBefore,
      websiteUrl: input.websiteUrl,
      socialUrl: input.socialUrl,
      currentStep: 'project_milestones',
      updatedAt: now,
      documents: input.proposalDocument
        ? {
            deleteMany: {
              kind: 'proposal',
            },
            create: {
              kind: 'proposal',
              fileName: input.proposalDocument.fileName,
              mimeType: input.proposalDocument.mimeType,
              sizeBytes: input.proposalDocument.sizeBytes,
              checksum: input.proposalDocument.checksum,
              storageUrl: input.proposalDocument.storageUrl,
              createdAt: now,
              updatedAt: now,
            },
          }
        : undefined,
    },
    include: projectInclude,
  });
}

export function replaceProjectMilestones(
  projectId: string,
  input: MilestonesInput
) {
  const now = new Date();

  return getDb().$transaction(async (tx) => {
    await tx.projectCreationMilestone.deleteMany({
      where: {
        projectId,
      },
    });

    await tx.project.update({
      where: {
        id: projectId,
      },
      data: {
        currentStep: 'campaign_details',
        updatedAt: now,
        milestones: {
          create: input.milestones.map((milestone, index) => ({
            name: milestone.name,
            cost: milestone.cost,
            endDate: milestone.endDate,
            sortOrder: index,
            createdAt: now,
            updatedAt: now,
          })),
        },
      },
    });

    return tx.project.findUniqueOrThrow({
      where: {
        id: projectId,
      },
      include: projectInclude,
    });
  });
}

export function upsertProjectCampaign(projectId: string, input: CampaignInput) {
  const now = new Date();

  return getDb().project.update({
    where: {
      id: projectId,
    },
    data: {
      currentStep: 'review',
      updatedAt: now,
      campaign: {
        upsert: {
          create: {
            tokenName: input.tokenName,
            digitalAssetSupply: input.digitalAssetSupply,
            price: input.price,
            currency: input.currency,
            minRaise: input.minRaise,
            maxRaise: input.maxRaise,
            minContribution: input.minContribution,
            maxContribution: input.maxContribution,
            startDate: input.startDate,
            endDate: input.endDate,
            generalContractorWalletAddress:
              input.generalContractorWalletAddress,
            pledgeAddress: input.pledgeAddress,
            updatedAt: now,
          },
          update: {
            tokenName: input.tokenName,
            digitalAssetSupply: input.digitalAssetSupply,
            price: input.price,
            currency: input.currency,
            minRaise: input.minRaise,
            maxRaise: input.maxRaise,
            minContribution: input.minContribution,
            maxContribution: input.maxContribution,
            startDate: input.startDate,
            endDate: input.endDate,
            generalContractorWalletAddress:
              input.generalContractorWalletAddress,
            pledgeAddress: input.pledgeAddress,
            updatedAt: now,
          },
        },
      },
    },
    include: projectInclude,
  });
}

export function submitProject(projectId: string) {
  const now = new Date();

  return getDb().project.update({
    where: {
      id: projectId,
    },
    data: {
      submissionStatus: 'submitted',
      currentStep: 'submitted',
      submittedAt: now,
      updatedAt: now,
    },
    include: projectInclude,
  });
}
