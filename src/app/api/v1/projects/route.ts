import type { NextRequest } from 'next/server';

import { requireBearerToken } from '@/server/auth/http';
import { handleApiError, jsonOk } from '@/server/http';
import { createPreSaleProjectDraft } from '@/server/services/projects';

export async function POST(request: NextRequest) {
  try {
    const project = await createPreSaleProjectDraft(
      requireBearerToken(request)
    );

    return jsonOk(project, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
