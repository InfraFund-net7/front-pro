import type { NextRequest } from 'next/server';

import { requireBearerToken } from '@/server/auth/http';
import { handleApiError, jsonOk } from '@/server/http';
import { saveProjectMilestones } from '@/server/services/projects';
import { parseMilestonesRequest } from '@/server/validation/projects';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const input = await parseMilestonesRequest(request);
    const project = await saveProjectMilestones(
      requireBearerToken(request),
      id,
      input
    );

    return jsonOk(project);
  } catch (error) {
    return handleApiError(error);
  }
}
