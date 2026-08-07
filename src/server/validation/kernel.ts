import 'server-only';

import { ApiError } from '@/server/http';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlPattern = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(?:[/?#:].*)?$/i;

export type JsonObject = Record<string, unknown>;

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

export function addFieldError(
  fields: Record<string, string>,
  field: string,
  message: string
) {
  fields[field] ??= message;
}

export function throwIfFieldErrors(fields: Record<string, string>) {
  if (Object.keys(fields).length > 0) {
    throw new ApiError('VALIDATION_ERROR', 'Validation failed', { fields });
  }
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

export function readString(
  body: JsonObject,
  fields: Record<string, string>,
  field: string,
  options: { required?: boolean; maxLength?: number; email?: boolean } = {}
) {
  const value = body[field];

  if (value === undefined || value === null) {
    if (options.required) addFieldError(fields, field, `${field} is required`);
    return undefined;
  }

  if (typeof value !== 'string') {
    addFieldError(fields, field, `${field} must be a string`);
    return undefined;
  }

  const trimmed = value.trim();

  if (options.required && !trimmed) {
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

  return trimmed || undefined;
}

export function readDecimalString(
  body: JsonObject,
  fields: Record<string, string>,
  field: string,
  options: { required?: boolean } = {}
) {
  const value = readString(body, fields, field, options);

  if (!value) return undefined;

  const normalized = value.replace(/,/g, '');

  if (!/^\d+(\.\d+)?$/.test(normalized) || Number(normalized) <= 0) {
    addFieldError(fields, field, `${field} must be a positive number`);
  }

  return normalized;
}

export function readBoolean(
  body: JsonObject,
  fields: Record<string, string>,
  field: string
) {
  const value = body[field];

  if (typeof value !== 'boolean') {
    addFieldError(fields, field, `${field} must be true or false`);
    return false;
  }

  return value;
}

export function readDate(
  body: JsonObject,
  fields: Record<string, string>,
  field: string,
  options: { required?: boolean } = {}
) {
  const value = readString(body, fields, field, options);

  if (!value) return undefined;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    addFieldError(fields, field, `${field} must be a valid date`);
  }

  return date;
}

export function readOptionalUrl(
  body: JsonObject,
  fields: Record<string, string>,
  field: string
) {
  const value = readString(body, fields, field, { maxLength: 2048 });

  if (value && !urlPattern.test(value)) {
    addFieldError(fields, field, `${field} must be a valid URL`);
  }

  if (value && !/^https?:\/\//i.test(value)) {
    return `https://${value}`;
  }

  return value;
}

export function readStringArray(
  body: JsonObject,
  fields: Record<string, string>,
  field: string,
  options: {
    required?: boolean;
    maxLength?: number;
    itemMaxLength?: number;
  } = {}
) {
  const value = body[field];

  if (value === undefined || value === null) {
    if (options.required) {
      addFieldError(fields, field, `${field} is required`);
    }
    return [];
  }

  if (!Array.isArray(value)) {
    addFieldError(fields, field, `${field} must be an array`);
    return [];
  }

  if (options.maxLength !== undefined && value.length > options.maxLength) {
    addFieldError(
      fields,
      field,
      `${field} must contain at most ${options.maxLength} items`
    );
  }

  return value.flatMap((item, index) => {
    if (typeof item !== 'string') {
      addFieldError(
        fields,
        `${field}.${index}`,
        `${field}.${index} must be a string`
      );
      return [];
    }

    const trimmed = item.trim();

    if (!trimmed) {
      addFieldError(
        fields,
        `${field}.${index}`,
        `${field}.${index} is required`
      );
      return [];
    }

    if (options.itemMaxLength && trimmed.length > options.itemMaxLength) {
      addFieldError(
        fields,
        `${field}.${index}`,
        `${field}.${index} must be at most ${options.itemMaxLength} characters`
      );
      return [];
    }

    return [trimmed];
  });
}
