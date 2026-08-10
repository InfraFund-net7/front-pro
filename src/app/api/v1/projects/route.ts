import type { NextRequest } from 'next/server';

import { requireBearerToken } from '@/server/auth/bearer';
import { handleApiError, jsonOk } from '@/server/http';
import {
  createPreSaleProjectDraft,
  listMyProjects,
} from '@/server/services/projects';

export async function GET(request: NextRequest) {
  try {
    const projects = await listMyProjects(requireBearerToken(request));

    return jsonOk(projects);
  } catch (error) {
    return handleApiError(error);
  }
}

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
