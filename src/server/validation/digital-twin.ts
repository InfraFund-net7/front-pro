import 'server-only';

import { ApiError } from '@/server/http';
import { readJsonObject } from '@/server/validation/public-forms';
import type { DigitalTwinComponentStatus } from '@/types/digital-twin';

const statuses: DigitalTwinComponentStatus[] = [
  'not_started',
  'in_progress',
  'installed',
  'delayed',
  'blocked',
];

function isDigitalTwinComponentStatus(
  value: unknown
): value is DigitalTwinComponentStatus {
  return (
    typeof value === 'string' &&
    statuses.includes(value as DigitalTwinComponentStatus)
  );
}

export async function parseComponentStatusRequest(request: Request) {
  const body = await readJsonObject(request);
  const status = body.status;

  if (!isDigitalTwinComponentStatus(status)) {
    throw new ApiError('VALIDATION_ERROR', 'Validation failed', {
      fields: { status: `status must be one of ${statuses.join(', ')}` },
    });
  }

  return { status };
}

export async function parseMilestoneCompleteRequest(request: Request) {
  const body = await readJsonObject(request);
  const completed = body.completed;

  if (typeof completed !== 'boolean') {
    throw new ApiError('VALIDATION_ERROR', 'Validation failed', {
      fields: { completed: 'completed must be true or false' },
    });
  }

  const status: DigitalTwinComponentStatus = completed
    ? 'installed'
    : 'not_started';

  return { status };
}
