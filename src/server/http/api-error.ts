import 'server-only';

import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE';

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  detail?: string;
  fields?: Record<string, string>;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly detail?: string;
  readonly fields?: Record<string, string>;

  constructor(
    code: ApiErrorCode,
    message: string,
    options: {
      status?: number;
      detail?: string;
      fields?: Record<string, string>;
      cause?: unknown;
    } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.code = code;
    this.status = options.status ?? statusByCode[code];
    this.detail = options.detail;
    this.fields = options.fields;
  }
}

const statusByCode: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function toApiErrorBody(error: ApiError): ApiErrorBody {
  return {
    code: error.code,
    message: error.message,
    ...(error.detail ? { detail: error.detail } : {}),
    ...(error.fields ? { fields: error.fields } : {}),
  };
}

export function jsonError(error: ApiError) {
  return NextResponse.json(toApiErrorBody(error), { status: error.status });
}

export function internalServerError() {
  return new ApiError('INTERNAL_SERVER_ERROR', 'Internal server error');
}
