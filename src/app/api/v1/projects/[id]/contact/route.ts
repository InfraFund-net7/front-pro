import type { NextRequest } from 'next/server';

import { requireBearerToken } from '@/server/auth/bearer';
import { handleApiError, jsonOk } from '@/server/http';
import { saveProjectContact } from '@/server/services/projects';
import { parseProjectContactRequest } from '@/server/validation/projects';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const input = await parseProjectContactRequest(request);
    const project = await saveProjectContact(
      requireBearerToken(request),
      id,
      input
    );

    return jsonOk(project);
  } catch (error) {
    return handleApiError(error);
  }
}
