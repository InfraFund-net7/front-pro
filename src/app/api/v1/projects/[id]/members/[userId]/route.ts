import type { NextRequest } from 'next/server';

import { requireBearerToken } from '@/server/auth/bearer';
import { handleApiError, jsonOk } from '@/server/http';
import { removeMemberFromProject } from '@/server/services/projects';

type RouteContext = {
  params: Promise<{ id: string; userId: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id, userId } = await context.params;
    const project = await removeMemberFromProject(
      requireBearerToken(request),
      id,
      userId
    );

    return jsonOk(project);
  } catch (error) {
    return handleApiError(error);
  }
}
