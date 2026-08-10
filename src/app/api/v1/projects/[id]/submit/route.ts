import type { NextRequest } from 'next/server';

import { requireBearerToken } from '@/server/auth/bearer';
import { handleApiError, jsonOk } from '@/server/http';
import { submitProjectDraft } from '@/server/services/projects';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const project = await submitProjectDraft(requireBearerToken(request), id);

    return jsonOk(project);
  } catch (error) {
    return handleApiError(error);
  }
}
