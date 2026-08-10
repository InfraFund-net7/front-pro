import type { NextRequest } from 'next/server';

import {
  handleApiError,
  jsonNoContent,
  verifyRequestCaptcha,
} from '@/server/http';
import { submitNonResidentWaitlist } from '@/server/services/public-forms';
import { parseNonResidentCompanyRequest } from '@/server/validation/public-forms';

export async function POST(request: NextRequest) {
  try {
    await verifyRequestCaptcha(request);

    const body = await parseNonResidentCompanyRequest(request);

    await submitNonResidentWaitlist({
      firstName: body.first_name,
      lastName: body.last_name,
      companyName: body.company_name,
      email: body.email,
      countryId: body.country_id,
      type: 'company',
    });

    return jsonNoContent();
  } catch (error) {
    return handleApiError(error);
  }
}
