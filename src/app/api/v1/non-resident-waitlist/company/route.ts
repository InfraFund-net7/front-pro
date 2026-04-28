import type { NextRequest } from 'next/server';

import {
  handleApiError,
  jsonNoContent,
  verifyRequestCaptcha,
} from '@/server/http';
import { submitNonResidentWaitlist } from '@/server/services/public-forms';
import {
  readJsonObject,
  requirePositiveIntegerField,
  requireStringField,
  throwIfFieldErrors,
} from '@/server/validation/public-forms';

export async function POST(request: NextRequest) {
  try {
    await verifyRequestCaptcha(request);

    const body = await readJsonObject(request);
    const fields: Record<string, string> = {};
    const firstName = requireStringField(body, fields, 'first_name', {
      minLength: 1,
      maxLength: 100,
    });
    const lastName = requireStringField(body, fields, 'last_name', {
      minLength: 1,
      maxLength: 100,
    });
    const email = requireStringField(body, fields, 'email', {
      minLength: 5,
      maxLength: 255,
      email: true,
    });
    const companyName = requireStringField(body, fields, 'company_name', {
      minLength: 1,
      maxLength: 255,
    });
    const countryId = requirePositiveIntegerField(body, fields, 'country_id');

    throwIfFieldErrors(fields);

    await submitNonResidentWaitlist({
      firstName,
      lastName,
      companyName,
      email,
      countryId,
      type: 'company',
    });

    return jsonNoContent();
  } catch (error) {
    return handleApiError(error);
  }
}
