import type { NextRequest } from 'next/server';

import { requireBearerToken } from '@/server/auth/http';
import { handleApiError, jsonOk } from '@/server/http';
import { saveProjectCampaign } from '@/server/services/projects';
import { parseCampaignRequest } from '@/server/validation/projects';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const input = await parseCampaignRequest(request);
    const project = await saveProjectCampaign(
      requireBearerToken(request),
      id,
      input
    );

    return jsonOk(project);
  } catch (error) {
    return handleApiError(error);
  }
}
