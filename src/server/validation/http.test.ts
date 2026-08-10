import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { parseRequestBody, readJsonObject } from './http';

function jsonRequest(body: unknown) {
  return new Request('http://test.local', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function rawRequest(body: string) {
  return new Request('http://test.local', { method: 'POST', body });
}

describe('readJsonObject', () => {
  it('returns the parsed body for a valid JSON object', async () => {
    const result = await readJsonObject(jsonRequest({ a: 1 }));
    expect(result).toEqual({ a: 1 });
  });

  it('rejects invalid JSON with BAD_REQUEST', async () => {
    await expect(readJsonObject(rawRequest('{not json'))).rejects.toMatchObject(
      { code: 'BAD_REQUEST', message: 'Invalid JSON request body' }
    );
  });

  it('rejects a JSON array body with BAD_REQUEST', async () => {
    await expect(readJsonObject(jsonRequest([1, 2, 3]))).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Request body must be a JSON object',
    });
  });

  it('rejects a JSON null body with BAD_REQUEST', async () => {
    await expect(readJsonObject(jsonRequest(null))).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });
});

describe('parseRequestBody', () => {
  const schema = z.object({ name: z.string().min(1) });

  it('returns parsed data on success', async () => {
    const result = await parseRequestBody(jsonRequest({ name: 'ok' }), schema);
    expect(result).toEqual({ name: 'ok' });
  });

  it('throws VALIDATION_ERROR with a fields map on failure', async () => {
    await expect(
      parseRequestBody(jsonRequest({ name: '' }), schema)
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fields: { name: expect.any(String) },
    });
  });

  it('propagates the BAD_REQUEST error for malformed JSON', async () => {
    await expect(
      parseRequestBody(rawRequest('not json'), schema)
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});
