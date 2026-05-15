import type { NextRequest } from 'next/server';

import {
  handleApiError,
  jsonNoContent,
  verifyRequestCaptcha,
} from '@/server/http';
import { submitWaitlist } from '@/server/services/public-forms';
import {
  readJsonObject,
  requireStringField,
  throwIfFieldErrors,
} from '@/server/validation/public-forms';

export async function POST(request: NextRequest) {
  try {
    await verifyRequestCaptcha(request);

    const body = await readJsonObject(request);
    const fields: Record<string, string> = {};
    const email = requireStringField(body, fields, 'email', {
      minLength: 5,
      maxLength: 255,
      email: true,
    });

    throwIfFieldErrors(fields);
    await submitWaitlist(email);

    return jsonNoContent();
  } catch (error) {
    return handleApiError(error);
  }
}
