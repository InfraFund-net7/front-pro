import 'server-only';

import { ApiError } from '@/server/http';

export function requireBearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  const prefix = 'Bearer ';

  if (!authorization.startsWith(prefix)) {
    throw new ApiError(
      'BAD_REQUEST',
      'Authorization bearer token is required.'
    );
  }

  const token = authorization.slice(prefix.length).trim();

  if (!token) {
    throw new ApiError(
      'BAD_REQUEST',
      'Authorization bearer token is required.'
    );
  }

  return token;
}
