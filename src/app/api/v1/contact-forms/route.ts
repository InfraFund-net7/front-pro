import type { NextRequest } from 'next/server';

import {
  getRequestMetadata,
  handleApiError,
  jsonNoContent,
  verifyRequestCaptcha,
} from '@/server/http';
import { submitContactForm } from '@/server/services/public-forms';
import { parseContactFormRequest } from '@/server/validation/public-forms';

export async function POST(request: NextRequest) {
  try {
    await verifyRequestCaptcha(request);

    const body = await parseContactFormRequest(request);
    const metadata = getRequestMetadata(request);

    await submitContactForm({
      firstName: body.first_name,
      lastName: body.last_name,
      email: body.email,
      subject: body.subject,
      message: body.message,
      ip: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return jsonNoContent();
  } catch (error) {
    return handleApiError(error);
  }
}
