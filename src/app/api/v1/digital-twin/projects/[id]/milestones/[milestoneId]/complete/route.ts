import type { NextRequest } from 'next/server';

import { requireBearerToken } from '@/server/auth/bearer';
import { completeMilestone } from '@/server/services/digital-twin';
import { handleApiError, jsonOk } from '@/server/http';
import { parseMilestoneCompleteRequest } from '@/server/validation/digital-twin';

type RouteContext = {
  params: Promise<{ id: string; milestoneId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id, milestoneId } = await context.params;
    const { status } = await parseMilestoneCompleteRequest(request);
    const view = await completeMilestone(
      requireBearerToken(request),
      id,
      milestoneId,
      status
    );

    return jsonOk(view);
  } catch (error) {
    return handleApiError(error);
  }
}
