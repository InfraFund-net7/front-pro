import 'server-only';

import type { DigitalTwinComponentStatus as PrismaDigitalTwinComponentStatus } from '@prisma/client';

import {
  bulkUpdateMilestoneComponentStatus,
  findComponentWithProjectId,
  findDigitalTwinViewForProject,
  findMilestoneWithProjectId,
  updateComponentStatus,
} from '@/server/repositories/digital-twin';
import { ApiError } from '@/server/http';
import { serializeDate, serializeDecimal } from '@/server/serialization';
import { requireDigitalTwinAccessFromBearer } from '@/server/services/digital-twin-access';
import {
  resolveRenderer,
  STATUS_COLORS,
  type DigitalTwinComponentStatus,
  type DigitalTwinView,
} from '@/types/digital-twin';

function asMetadataRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asEnergyMetrics(metadata: Record<string, unknown> | null) {
  const value = metadata?.energyMetrics;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const {
      label,
      value: metricValue,
      helper,
    } = item as Record<string, unknown>;

    if (
      typeof label !== 'string' ||
      typeof metricValue !== 'string' ||
      typeof helper !== 'string'
    ) {
      return [];
    }

    return [{ label, value: metricValue, helper }];
  });
}

type ProjectDigitalTwinView = NonNullable<
  Awaited<ReturnType<typeof findDigitalTwinViewForProject>>
>;

function shapeDigitalTwinView(
  project: ProjectDigitalTwinView
): DigitalTwinView | null {
  const model = project.digitalTwinModels[0];

  if (!model) {
    return null;
  }

  const modelMetadata = asMetadataRecord(model.metadata);

  return {
    projectId: project.id,
    projectName: project.name ?? 'Untitled project',
    model: {
      id: model.id,
      name: model.name,
      assetUrl: model.assetUrl,
      format: model.format,
      renderer: resolveRenderer(model.format),
      cesiumIonAssetId: model.cesiumIonAssetId,
      metadata: modelMetadata,
      energyMetrics: asEnergyMetrics(modelMetadata),
      components: model.components.map((component) => ({
        id: component.id,
        externalId: component.externalId,
        displayName: component.displayName,
        category: component.category,
        nodeName: component.nodeName,
        status: component.status,
        color: component.statusColor ?? STATUS_COLORS[component.status],
        isVisible: component.isVisible,
        metadata: asMetadataRecord(component.metadata),
      })),
    },
    milestones: project.milestones.map((milestone) => ({
      id: milestone.id,
      name: milestone.name,
      cost: serializeDecimal(milestone.cost),
      endDate: serializeDate(milestone.endDate),
      sortOrder: milestone.sortOrder,
      componentIds: milestone.components.map((mapping) => mapping.componentId),
    })),
  };
}

export async function getDigitalTwinView(
  projectId: string
): Promise<DigitalTwinView> {
  const project = await findDigitalTwinViewForProject(projectId);

  if (!project) {
    throw new ApiError('NOT_FOUND', 'Project not found.');
  }

  const view = shapeDigitalTwinView(project);

  if (!view) {
    throw new ApiError(
      'NOT_FOUND',
      'Project has no active digital twin model.'
    );
  }

  return view;
}

function toPrismaStatus(
  status: DigitalTwinComponentStatus
): PrismaDigitalTwinComponentStatus {
  return status;
}

export async function setComponentStatus(
  accessToken: string,
  projectId: string,
  componentId: string,
  status: DigitalTwinComponentStatus
): Promise<DigitalTwinView> {
  await requireDigitalTwinAccessFromBearer(accessToken, projectId);

  const component = await findComponentWithProjectId(componentId);

  if (!component || component.model.projectId !== projectId) {
    throw new ApiError('NOT_FOUND', 'Digital twin component not found.');
  }

  await updateComponentStatus(componentId, toPrismaStatus(status));

  return getDigitalTwinView(projectId);
}

export async function completeMilestone(
  accessToken: string,
  projectId: string,
  milestoneId: string,
  status: DigitalTwinComponentStatus
): Promise<DigitalTwinView> {
  await requireDigitalTwinAccessFromBearer(accessToken, projectId);

  const milestone = await findMilestoneWithProjectId(milestoneId);

  if (!milestone || milestone.projectId !== projectId) {
    throw new ApiError('NOT_FOUND', 'Milestone not found.');
  }

  await bulkUpdateMilestoneComponentStatus(milestoneId, toPrismaStatus(status));

  return getDigitalTwinView(projectId);
}
