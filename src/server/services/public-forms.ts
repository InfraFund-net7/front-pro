import 'server-only';

import { ApiError } from '@/server/http';
import {
  countryExists,
  createContactForm,
  createNonResidentWaitlistEntry,
  createWaitlistEntry,
  isUniqueConstraintError,
  listCountries,
  waitlistEmailExists,
  type ContactFormRecord,
  type NonResidentWaitlistRecord,
} from '@/server/repositories/public-forms';
import { sendContactFormNotification } from '@/server/services/email';

export async function submitWaitlist(email: string) {
  if (await waitlistEmailExists(email)) {
    throw new ApiError('CONFLICT', 'email already exists');
  }

  try {
    await createWaitlistEntry(email);
  } catch (error) {
    if (isUniqueConstraintError(error, 'email')) {
      throw new ApiError('CONFLICT', 'email already exists');
    }

    throw error;
  }
}

export async function submitContactForm(record: ContactFormRecord) {
  await createContactForm(record);
  sendContactFormNotification(record);
}

export async function submitNonResidentWaitlist(
  record: NonResidentWaitlistRecord
) {
  if (!(await countryExists(record.countryId))) {
    throw new ApiError('BAD_REQUEST', 'invalid country ID');
  }

  try {
    await createNonResidentWaitlistEntry(record);
  } catch (error) {
    if (isUniqueConstraintError(error, 'email')) {
      throw new ApiError('CONFLICT', 'email already exists');
    }

    throw error;
  }
}

export async function getCountries(options: {
  query: string;
  offset: number;
  limit: number;
}) {
  const countries = await listCountries(options);

  return {
    items: countries.map((country) => ({
      ID: country.id,
      Name: country.name,
      Iso: country.iso,
      Iso3: country.iso3,
      Code: country.code,
      PhoneCode: country.phoneCode,
    })),
  };
}
