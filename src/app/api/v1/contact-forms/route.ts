import type { NextRequest } from 'next/server';

import {
  getRequestMetadata,
  handleApiError,
  jsonNoContent,
  verifyRequestCaptcha,
} from '@/server/http';
import { submitContactForm } from '@/server/services/public-forms';
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
    const subject = requireStringField(body, fields, 'subject', {
      minLength: 1,
      maxLength: 255,
    });
    const message = requireStringField(body, fields, 'message', {
      minLength: 1,
      maxLength: 3000,
    });

    throwIfFieldErrors(fields);

    const metadata = getRequestMetadata(request);

    await submitContactForm({
      firstName,
      lastName,
      email,
      subject,
      message,
      ip: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return jsonNoContent();
  } catch (error) {
    return handleApiError(error);
  }
}
