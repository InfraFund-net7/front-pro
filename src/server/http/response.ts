import 'server-only';

import { NextResponse } from 'next/server';

import {
  ApiError,
  internalServerError,
  isApiError,
  jsonError,
} from './api-error';

export interface ApiSuccessBody<T> {
  code: 'OK';
  data: T;
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccessBody<T>>(
    { code: 'OK', data },
    { status: init?.status ?? 200, headers: init?.headers }
  );
}

export function jsonNoContent() {
  return new NextResponse(null, { status: 204 });
}

export function handleApiError(error: unknown) {
  if (isApiError(error)) {
    return jsonError(error);
  }

  return jsonError(internalServerError());
}

export function badRequest(message: string, detail?: string) {
  return new ApiError('BAD_REQUEST', message, { detail });
}

export function unauthorized(message = 'Unauthorized') {
  return new ApiError('UNAUTHORIZED', message);
}
