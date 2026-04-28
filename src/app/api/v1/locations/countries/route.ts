import type { NextRequest } from 'next/server';

import { ApiError, handleApiError, jsonOk } from '@/server/http';
import { getCountries } from '@/server/services/public-forms';

function readIntegerParam(
  searchParams: URLSearchParams,
  name: string,
  fallback: number
) {
  const value = searchParams.get(name);

  if (value === null || value === '') return fallback;

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new ApiError('VALIDATION_ERROR', 'Validation failed', {
      fields: {
        [name]: `${name} must be an integer`,
      },
    });
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = (searchParams.get('query') ?? '').trim();
    const offset = readIntegerParam(searchParams, 'offset', 0);
    const limit = readIntegerParam(searchParams, 'limit', 10);
    const fields: Record<string, string> = {};

    if (query.length > 100) {
      fields.query = 'query must be at most 100 characters';
    }

    if (offset < 0) {
      fields.offset = 'offset must be greater than or equal to 0';
    }

    if (limit < 1 || limit > 100) {
      fields.limit = 'limit must be between 1 and 100';
    }

    if (Object.keys(fields).length > 0) {
      throw new ApiError('VALIDATION_ERROR', 'Validation failed', { fields });
    }

    return jsonOk(await getCountries({ query, offset, limit }));
  } catch (error) {
    return handleApiError(error);
  }
}
