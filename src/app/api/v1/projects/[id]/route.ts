import type { NextRequest } from 'next/server';

import { requireBearerToken } from '@/server/auth/http';
import { handleApiError, jsonOk } from '@/server/http';
import { getProject } from '@/server/services/projects';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const project = await getProject(requireBearerToken(request), id);

    return jsonOk(project);
  } catch (error) {
    return handleApiError(error);
  }
}
