import type { NextRequest } from 'next/server';

import { requireBearerToken } from '@/server/auth/http';
import { setComponentStatus } from '@/server/services/digital-twin';
import { handleApiError, jsonOk } from '@/server/http';
import { parseComponentStatusRequest } from '@/server/validation/digital-twin';

type RouteContext = {
  params: Promise<{ id: string; componentId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id, componentId } = await context.params;
    const { status } = await parseComponentStatusRequest(request);
    const view = await setComponentStatus(
      requireBearerToken(request),
      id,
      componentId,
      status
    );

    return jsonOk(view);
  } catch (error) {
    return handleApiError(error);
  }
}
