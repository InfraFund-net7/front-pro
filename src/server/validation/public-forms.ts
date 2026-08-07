import 'server-only';

import { z } from 'zod';

import { parseRequestBody } from '@/server/validation/http';

export { readJsonObject } from '@/server/validation/http';

const email = z
  .string()
  .trim()
  .min(5, 'email is required')
  .max(255, 'email must be at most 255 characters')
  .email('email must be a valid email address');

const requiredName = (field: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .max(maxLength, `${field} must be at most ${maxLength} characters`);

const countryId = z
  .number()
  .int()
  .positive('country_id must be a positive integer');

const waitlistSchema = z.object({
  email,
});

export async function parseWaitlistRequest(request: Request) {
  return parseRequestBody(request, waitlistSchema);
}

const contactFormSchema = z.object({
  first_name: requiredName('first_name', 100),
  last_name: requiredName('last_name', 100),
  email,
  subject: requiredName('subject', 255),
  message: requiredName('message', 3000),
});

export async function parseContactFormRequest(request: Request) {
  return parseRequestBody(request, contactFormSchema);
}

const nonResidentIndividualSchema = z.object({
  first_name: requiredName('first_name', 100),
  last_name: requiredName('last_name', 100),
  email,
  country_id: countryId,
});

export async function parseNonResidentIndividualRequest(request: Request) {
  return parseRequestBody(request, nonResidentIndividualSchema);
}

const nonResidentCompanySchema = z.object({
  first_name: requiredName('first_name', 100),
  last_name: requiredName('last_name', 100),
  email,
  company_name: requiredName('company_name', 255),
  country_id: countryId,
});

export async function parseNonResidentCompanyRequest(request: Request) {
  return parseRequestBody(request, nonResidentCompanySchema);
}
