import 'server-only';

import { z } from 'zod';

import { parseRequestBody } from '@/server/validation/http';
import type { DigitalTwinComponentStatus } from '@/types/digital-twin';

const statuses = [
  'not_started',
  'in_progress',
  'installed',
  'delayed',
  'blocked',
] as const satisfies readonly DigitalTwinComponentStatus[];

const componentStatusSchema = z.object({
  status: z.enum(statuses, `status must be one of ${statuses.join(', ')}`),
});

export async function parseComponentStatusRequest(request: Request) {
  return parseRequestBody(request, componentStatusSchema);
}

const milestoneCompleteSchema = z
  .object({
    completed: z.boolean(),
  })
  .transform(({ completed }) => ({
    status: (completed
      ? 'installed'
      : 'not_started') as DigitalTwinComponentStatus,
  }));

export async function parseMilestoneCompleteRequest(request: Request) {
  return parseRequestBody(request, milestoneCompleteSchema);
}
