import 'server-only';

import type { z } from 'zod';

import { ApiError } from '@/server/http';

export async function readJsonObject(
  request: Request
): Promise<Record<string, unknown>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ApiError('BAD_REQUEST', 'Invalid JSON request body');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError('BAD_REQUEST', 'Request body must be a JSON object');
  }

  return body as Record<string, unknown>;
}

// Parses+validates a JSON request body against a zod schema, translating
// failures into the same { code: 'VALIDATION_ERROR', fields } shape the
// hand-rolled validators used, keyed by dot-path (e.g. 'milestones.0.name')
// so existing frontend fieldErrors.<field> lookups keep working unchanged.
export async function parseRequestBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<T> {
  const body = await readJsonObject(request);
  const result = schema.safeParse(body);

  if (!result.success) {
    const fields: Record<string, string> = {};

    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? issue.path.join('.') : '_root';
      fields[path] ??= issue.message;
    }

    throw new ApiError('VALIDATION_ERROR', 'Validation failed', { fields });
  }

  return result.data;
}
