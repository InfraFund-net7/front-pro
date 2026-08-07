import { describe, expect, it } from 'vitest';

import {
  parseComponentStatusRequest,
  parseMilestoneCompleteRequest,
} from './digital-twin';

function jsonRequest(body: unknown) {
  return new Request('http://test.local', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

describe('parseComponentStatusRequest', () => {
  it('accepts a valid status', async () => {
    const result = await parseComponentStatusRequest(
      jsonRequest({ status: 'installed' })
    );
    expect(result).toEqual({ status: 'installed' });
  });

  it('rejects an invalid status', async () => {
    await expect(
      parseComponentStatusRequest(jsonRequest({ status: 'destroyed' }))
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fields: { status: expect.any(String) },
    });
  });

  it('rejects a missing status', async () => {
    await expect(
      parseComponentStatusRequest(jsonRequest({}))
    ).rejects.toMatchObject({ fields: { status: expect.any(String) } });
  });
});

describe('parseMilestoneCompleteRequest', () => {
  it('maps completed: true to status "installed"', async () => {
    const result = await parseMilestoneCompleteRequest(
      jsonRequest({ completed: true })
    );
    expect(result).toEqual({ status: 'installed' });
  });

  it('maps completed: false to status "not_started"', async () => {
    const result = await parseMilestoneCompleteRequest(
      jsonRequest({ completed: false })
    );
    expect(result).toEqual({ status: 'not_started' });
  });

  it('rejects a non-boolean completed value', async () => {
    await expect(
      parseMilestoneCompleteRequest(jsonRequest({ completed: 'yes' }))
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});
