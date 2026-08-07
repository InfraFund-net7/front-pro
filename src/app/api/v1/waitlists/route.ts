import type { NextRequest } from 'next/server';

import {
  handleApiError,
  jsonNoContent,
  verifyRequestCaptcha,
} from '@/server/http';
import { submitWaitlist } from '@/server/services/public-forms';
import { parseWaitlistRequest } from '@/server/validation/public-forms';

export async function POST(request: NextRequest) {
  try {
    await verifyRequestCaptcha(request);

    const { email } = await parseWaitlistRequest(request);

    await submitWaitlist(email);

    return jsonNoContent();
  } catch (error) {
    return handleApiError(error);
  }
}
