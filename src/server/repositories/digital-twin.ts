import 'server-only';

import type { DigitalTwinComponentStatus } from '@prisma/client';

import { getDb } from '@/server/db';

const digitalTwinViewInclude = {
  digitalTwinModels: {
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc' as const,
    },
    take: 1,
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
        select: {
          componentId: true,
        },
      },
    },
  },
};

export function findDigitalTwinViewForProject(projectId: string) {
  return getDb().project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      name: true,
      ...digitalTwinViewInclude,
    },
  });
}

export function updateComponentStatus(
  componentId: string,
  status: DigitalTwinComponentStatus
) {
  return getDb().projectDigitalTwinComponent.update({
    where: {
      id: componentId,
    },
    data: {
      status,
      isVisible: status !== 'not_started',
      updatedAt: new Date(),
    },
  });
}

export async function bulkUpdateMilestoneComponentStatus(
  milestoneId: string,
  status: DigitalTwinComponentStatus
) {
  const now = new Date();

  return getDb().$transaction(async (tx) => {
    const mappings = await tx.projectCreationMilestoneComponent.findMany({
      where: {
        milestoneId,
      },
      select: {
        componentId: true,
      },
    });

    if (mappings.length === 0) {
      return { count: 0 };
    }

    return tx.projectDigitalTwinComponent.updateMany({
      where: {
        id: {
          in: mappings.map((mapping) => mapping.componentId),
        },
      },
      data: {
        status,
        isVisible: status !== 'not_started',
        updatedAt: now,
      },
    });
  });
}

export function findComponentWithProjectId(componentId: string) {
  return getDb().projectDigitalTwinComponent.findUnique({
    where: {
      id: componentId,
    },
    select: {
      id: true,
      model: {
        select: {
          projectId: true,
        },
      },
    },
  });
}

export function findMilestoneWithProjectId(milestoneId: string) {
  return getDb().projectCreationMilestone.findUnique({
    where: {
      id: milestoneId,
    },
    select: {
      id: true,
      projectId: true,
    },
  });
}
