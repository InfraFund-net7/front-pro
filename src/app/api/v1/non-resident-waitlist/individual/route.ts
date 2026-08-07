import type { NextRequest } from 'next/server';

import {
  handleApiError,
  jsonNoContent,
  verifyRequestCaptcha,
} from '@/server/http';
import { submitNonResidentWaitlist } from '@/server/services/public-forms';
import { parseNonResidentIndividualRequest } from '@/server/validation/public-forms';

export async function POST(request: NextRequest) {
  try {
    await verifyRequestCaptcha(request);

    const body = await parseNonResidentIndividualRequest(request);

    await submitNonResidentWaitlist({
      firstName: body.first_name,
      lastName: body.last_name,
      email: body.email,
      countryId: body.country_id,
      type: 'individual',
    });

    return jsonNoContent();
  } catch (error) {
    return handleApiError(error);
  }
}
