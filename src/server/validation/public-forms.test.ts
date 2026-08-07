import { describe, expect, it } from 'vitest';

import {
  parseContactFormRequest,
  parseNonResidentCompanyRequest,
  parseNonResidentIndividualRequest,
  parseWaitlistRequest,
} from './public-forms';

function jsonRequest(body: unknown) {
  return new Request('http://test.local', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('parseWaitlistRequest', () => {
  it('accepts a valid email', async () => {
    const result = await parseWaitlistRequest(
      jsonRequest({ email: 'a@b.com' })
    );
    expect(result).toEqual({ email: 'a@b.com' });
  });

  it('rejects a missing email with fields.email', async () => {
    await expect(parseWaitlistRequest(jsonRequest({}))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fields: { email: expect.any(String) },
    });
  });

  it('rejects an invalid email', async () => {
    await expect(
      parseWaitlistRequest(jsonRequest({ email: 'not-an-email' }))
    ).rejects.toMatchObject({ fields: { email: expect.any(String) } });
  });
});

describe('parseContactFormRequest', () => {
  const valid = {
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    subject: 'Hello',
    message: 'This is a message.',
  };

  it('accepts a fully valid body', async () => {
    const result = await parseContactFormRequest(jsonRequest(valid));
    expect(result).toEqual(valid);
  });

  it('rejects when required fields are missing', async () => {
    await expect(
      parseContactFormRequest(jsonRequest({}))
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fields: {
        first_name: expect.any(String),
        last_name: expect.any(String),
        email: expect.any(String),
        subject: expect.any(String),
        message: expect.any(String),
      },
    });
  });
});

describe('parseNonResidentIndividualRequest', () => {
  it('accepts a valid body', async () => {
    const result = await parseNonResidentIndividualRequest(
      jsonRequest({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        country_id: 5,
      })
    );
    expect(result.country_id).toBe(5);
  });

  it('rejects a non-integer country_id', async () => {
    await expect(
      parseNonResidentIndividualRequest(
        jsonRequest({
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@example.com',
          country_id: 1.5,
        })
      )
    ).rejects.toMatchObject({ fields: { country_id: expect.any(String) } });
  });

  it('rejects a negative country_id', async () => {
    await expect(
      parseNonResidentIndividualRequest(
        jsonRequest({
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@example.com',
          country_id: -1,
        })
      )
    ).rejects.toMatchObject({ fields: { country_id: expect.any(String) } });
  });
});

describe('parseNonResidentCompanyRequest', () => {
  it('requires company_name in addition to the individual fields', async () => {
    await expect(
      parseNonResidentCompanyRequest(
        jsonRequest({
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@example.com',
          country_id: 5,
        })
      )
    ).rejects.toMatchObject({ fields: { company_name: expect.any(String) } });
  });

  it('accepts a fully valid body', async () => {
    const result = await parseNonResidentCompanyRequest(
      jsonRequest({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        company_name: 'Acme Ltd',
        country_id: 5,
      })
    );
    expect(result.company_name).toBe('Acme Ltd');
  });
});
