import 'server-only';

import { Prisma } from '@prisma/client';

import { getDb } from '@/server/db';

export interface ContactFormRecord {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  ip?: string;
  userAgent?: string;
}

export interface NonResidentWaitlistRecord {
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  countryId: number;
  type: 'individual' | 'company';
}

export function isUniqueConstraintError(error: unknown, field: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002' &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes(field)
  );
}

export async function waitlistEmailExists(email: string) {
  const count = await getDb().waitlist.count({
    where: {
      email,
    },
  });

  return count > 0;
}

export async function createWaitlistEntry(email: string) {
  await getDb().waitlist.create({
    data: {
      email,
    },
  });
}

export async function createContactForm(record: ContactFormRecord) {
  await getDb().contactForm.create({
    data: {
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      subject: record.subject,
      message: record.message,
      ip: record.ip,
      userAgent: record.userAgent,
      status: 'new',
    },
  });
}

export async function countryExists(countryId: number) {
  const count = await getDb().country.count({
    where: {
      id: countryId,
    },
  });

  return count > 0;
}

export async function createNonResidentWaitlistEntry(
  record: NonResidentWaitlistRecord
) {
  await getDb().nonResidentWaitlist.create({
    data: {
      firstName: record.firstName,
      lastName: record.lastName,
      companyName: record.companyName,
      email: record.email,
      countryId: record.countryId,
      type: record.type,
    },
  });
}

export async function listCountries(options: {
  query: string;
  offset: number;
  limit: number;
}) {
  return getDb().country.findMany({
    where: options.query
      ? {
          name: {
            contains: options.query,
            mode: 'insensitive',
          },
        }
      : undefined,
    orderBy: {
      name: 'asc',
    },
    skip: options.offset,
    take: options.limit,
  });
}
