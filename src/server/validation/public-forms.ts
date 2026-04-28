import 'server-only';

import { ApiError } from '@/server/http';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type JsonObject = Record<string, unknown>;

export async function readJsonObject(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ApiError('BAD_REQUEST', 'Request body must be a JSON object');
    }

    return body as JsonObject;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('BAD_REQUEST', 'Invalid JSON request body');
  }
}

function addFieldError(
  fields: Record<string, string>,
  field: string,
  message: string
) {
  fields[field] ??= message;
}

export function requireStringField(
  body: JsonObject,
  fields: Record<string, string>,
  field: string,
  options: { minLength?: number; maxLength?: number; email?: boolean } = {}
) {
  const value = body[field];

  if (typeof value !== 'string') {
    addFieldError(fields, field, `${field} is required`);
    return '';
  }

  const trimmed = value.trim();

  if (options.minLength && trimmed.length < options.minLength) {
    addFieldError(fields, field, `${field} is required`);
  }

  if (options.maxLength && trimmed.length > options.maxLength) {
    addFieldError(
      fields,
      field,
      `${field} must be at most ${options.maxLength} characters`
    );
  }

  if (options.email && trimmed && !emailPattern.test(trimmed)) {
    addFieldError(fields, field, `${field} must be a valid email address`);
  }

  return trimmed;
}

export function requirePositiveIntegerField(
  body: JsonObject,
  fields: Record<string, string>,
  field: string
) {
  const value = body[field];

  if (!Number.isInteger(value) || (value as number) <= 0) {
    addFieldError(fields, field, `${field} must be a positive integer`);
    return 0;
  }

  return value as number;
}

export function throwIfFieldErrors(fields: Record<string, string>) {
  if (Object.keys(fields).length > 0) {
    throw new ApiError('VALIDATION_ERROR', 'Validation failed', { fields });
  }
}
