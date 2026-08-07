import type { NextRequest } from 'next/server';

import { requireBearerToken } from '@/server/auth/bearer';
import { handleApiError, jsonOk } from '@/server/http';
import { inviteProjectMember } from '@/server/services/projects';
import { parseInviteMemberRequest } from '@/server/validation/projects';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const input = await parseInviteMemberRequest(request);
    const project = await inviteProjectMember(
      requireBearerToken(request),
      id,
      input
    );

    return jsonOk(project, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
