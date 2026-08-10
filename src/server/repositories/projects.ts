import 'server-only';

import { Prisma, type ProjectStatus, type UserRole } from '@prisma/client';

import { HARDWIRED_PROJECT_MODEL } from '@/server/digital-twin/project-model';
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
  accountRoles: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
  digitalTwinModels: {
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc' as const,
    },
    include: {
      components: {
        orderBy: {
          sortOrder: 'asc' as const,
        },
      },
    },
  },
  milestones: {
    orderBy: {
      sortOrder: 'asc' as const,
    },
    include: {
      components: {
        orderBy: {
          sortOrder: 'asc' as const,
        },
        include: {
          component: true,
        },
      },
    },
  },
} satisfies Prisma.ProjectInclude;

export type ProjectWithDetails = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

export async function createProjectDraft(ownerUserId: string, role: UserRole) {
  const project = await getDb().project.create({
    data: {
      ownerUserId,
      crowdfundingModel: 'pre_sale',
      currentStep: 'contact_information',
      accountRoles: {
        create: {
          userId: ownerUserId,
          role,
        },
      },
    },
    include: projectInclude,
  });

  return ensureProjectDigitalTwinModel(project.id);
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

export function findProjectsForAccount(userId: string) {
  return getDb().project.findMany({
    where: {
      accountRoles: {
        some: {
          userId,
        },
      },
    },
    include: projectInclude,
    orderBy: {
      updatedAt: 'desc',
    },
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

export async function replaceProjectMilestones(
  projectId: string,
  input: MilestonesInput
) {
  const now = new Date();
  const project = await ensureProjectDigitalTwinModel(projectId);
  const activeModel = project.digitalTwinModels[0];
  const componentIdsByExternalId = new Map(
    activeModel?.components.map((component) => [
      component.externalId,
      component.id,
    ])
  );

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
            components: {
              create: milestone.componentExternalIds.flatMap(
                (externalId, componentIndex) => {
                  const componentId = componentIdsByExternalId.get(externalId);

                  if (!componentId) {
                    return [];
                  }

                  return {
                    componentId,
                    sortOrder: componentIndex,
                    createdAt: now,
                    updatedAt: now,
                  };
                }
              ),
            },
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

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: UserRole
) {
  await getDb().projectAccountRole.create({
    data: {
      projectId,
      userId,
      role,
    },
  });

  return getDb().project.findUniqueOrThrow({
    where: { id: projectId },
    include: projectInclude,
  });
}

export async function removeProjectMember(projectId: string, userId: string) {
  await getDb().projectAccountRole.deleteMany({
    where: {
      projectId,
      userId,
    },
  });

  return getDb().project.findUniqueOrThrow({
    where: { id: projectId },
    include: projectInclude,
  });
}

// Projects under construction start with an empty 3D model -- every
// component hidden, regardless of the hardwired catalog's own isVisible
// flags -- so investors watch the build progress component by component
// as the owner checks off each milestone (see MilestoneChecklist /
// updateComponentStatus, which flips isVisible back on with status).
// Projects in any other lifecycle stage keep the catalog's defaults.
const CONSTRUCTION_PROJECT_STATUS: ProjectStatus = 'in_development';

async function ensureProjectDigitalTwinModel(projectId: string) {
  const now = new Date();

  return getDb().$transaction(async (tx) => {
    const { projectStatus } = await tx.project.findUniqueOrThrow({
      where: { id: projectId },
      select: { projectStatus: true },
    });
    const isUnderConstruction = projectStatus === CONSTRUCTION_PROJECT_STATUS;
    const componentSeed = HARDWIRED_PROJECT_MODEL.components.map(
      (component) => ({
        ...component,
        isVisible: isUnderConstruction ? false : component.isVisible,
      })
    );

    await tx.projectDigitalTwinModel.upsert({
      where: {
        projectId,
      },
      update: {
        name: HARDWIRED_PROJECT_MODEL.name,
        assetUrl: HARDWIRED_PROJECT_MODEL.assetUrl,
        format: HARDWIRED_PROJECT_MODEL.format,
        source: HARDWIRED_PROJECT_MODEL.source,
        isActive: true,
        updatedAt: now,
        components: {
          deleteMany: {},
          create: componentSeed.map((component) => ({
            externalId: component.externalId,
            displayName: component.displayName,
            nodeName: component.nodeName,
            category: component.category,
            sortOrder: component.sortOrder,
            isVisible: component.isVisible,
            createdAt: now,
            updatedAt: now,
          })),
        },
      },
      create: {
        projectId,
        name: HARDWIRED_PROJECT_MODEL.name,
        assetUrl: HARDWIRED_PROJECT_MODEL.assetUrl,
        format: HARDWIRED_PROJECT_MODEL.format,
        source: HARDWIRED_PROJECT_MODEL.source,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        components: {
          create: componentSeed.map((component) => ({
            externalId: component.externalId,
            displayName: component.displayName,
            nodeName: component.nodeName,
            category: component.category,
            sortOrder: component.sortOrder,
            isVisible: component.isVisible,
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
