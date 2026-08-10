import { describe, expect, it } from 'vitest';

import {
  parseCampaignRequest,
  parseMilestonesRequest,
  parseProjectContactRequest,
  parseProjectInformationRequest,
} from './projects';

function req(body: unknown) {
  return new Request('http://test.local', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

describe('parseProjectContactRequest', () => {
  const valid = {
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    title: 'CEO',
    phone_number: '555-1234',
  };

  it('accepts a fully valid body and maps to camelCase', async () => {
    const result = await parseProjectContactRequest(req(valid));
    expect(result).toEqual({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      title: 'CEO',
      phoneNumber: '555-1234',
    });
  });

  it('treats an empty phone_number as absent, not a validation error', async () => {
    const result = await parseProjectContactRequest(
      req({ ...valid, phone_number: '' })
    );
    expect(result.phoneNumber).toBeUndefined();
  });

  it('rejects missing required fields', async () => {
    await expect(parseProjectContactRequest(req({}))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fields: {
        first_name: expect.any(String),
        last_name: expect.any(String),
        email: expect.any(String),
        title: expect.any(String),
      },
    });
  });

  it('rejects an invalid email', async () => {
    await expect(
      parseProjectContactRequest(req({ ...valid, email: 'nope' }))
    ).rejects.toMatchObject({ fields: { email: expect.any(String) } });
  });
});

describe('parseProjectInformationRequest', () => {
  const valid = {
    name: 'Wind Farm',
    description: 'A wind farm project.',
    target_investment_amount: '1,000,000',
    infrastructure_type: 'wind_energy',
    project_status: 'planning',
    raised_before: false,
  };

  it('accepts a fully valid body, stripping commas from the amount', async () => {
    const result = await parseProjectInformationRequest(req(valid));
    expect(result.targetInvestmentAmount).toBe('1000000');
    expect(result.infrastructureType).toBe('wind_energy');
  });

  it('rejects an invalid infrastructure_type enum value', async () => {
    await expect(
      parseProjectInformationRequest(
        req({ ...valid, infrastructure_type: 'fusion' })
      )
    ).rejects.toMatchObject({
      fields: { infrastructure_type: expect.any(String) },
    });
  });

  it('rejects a non-positive target_investment_amount', async () => {
    await expect(
      parseProjectInformationRequest(
        req({ ...valid, target_investment_amount: '0' })
      )
    ).rejects.toMatchObject({
      fields: { target_investment_amount: expect.any(String) },
    });
  });

  it('normalizes a bare-domain website_url by prepending https://', async () => {
    const result = await parseProjectInformationRequest(
      req({ ...valid, website_url: 'example.com' })
    );
    expect(result.websiteUrl).toBe('https://example.com');
  });

  it('treats an empty website_url as absent', async () => {
    const result = await parseProjectInformationRequest(
      req({ ...valid, website_url: '' })
    );
    expect(result.websiteUrl).toBeUndefined();
  });

  it('rejects a malformed website_url', async () => {
    await expect(
      parseProjectInformationRequest(
        req({ ...valid, website_url: 'not a url at all!!' })
      )
    ).rejects.toMatchObject({ fields: { website_url: expect.any(String) } });
  });

  it('passes through a valid proposal_document', async () => {
    const result = await parseProjectInformationRequest(
      req({
        ...valid,
        proposal_document: {
          file_name: 'proposal.pdf',
          mime_type: 'application/pdf',
          size_bytes: 1024,
          storage_url: 'https://example.com/file.pdf',
        },
      })
    );
    expect(result.proposalDocument).toMatchObject({
      fileName: 'proposal.pdf',
      sizeBytes: 1024,
    });
  });
});

describe('parseCampaignRequest', () => {
  const valid = {
    token_name: 'MyToken',
    digital_asset_supply: '1000',
    price: '10',
    currency: 'usdc',
    min_raise: '1000',
    max_raise: '10000',
    min_contribution: '10',
    max_contribution: '1000',
    start_date: '2026-01-01',
    end_date: '2026-02-01',
  };

  it('accepts a fully valid body and upper-cases currency', async () => {
    const result = await parseCampaignRequest(req(valid));
    expect(result.currency).toBe('USDC');
    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeInstanceOf(Date);
  });

  it('defaults currency to USDC when omitted', async () => {
    // JSON.stringify drops `undefined` values, so this omits the key
    // entirely rather than sending an explicit currency.
    const result = await parseCampaignRequest(
      req({ ...valid, currency: undefined })
    );
    expect(result.currency).toBe('USDC');
  });

  it('rejects end_date before start_date, attributed to end_date', async () => {
    await expect(
      parseCampaignRequest(
        req({ ...valid, start_date: '2026-02-01', end_date: '2026-01-01' })
      )
    ).rejects.toMatchObject({ fields: { end_date: expect.any(String) } });
  });

  it('rejects max_raise less than min_raise, attributed to max_raise', async () => {
    await expect(
      parseCampaignRequest(
        req({ ...valid, min_raise: '10000', max_raise: '1000' })
      )
    ).rejects.toMatchObject({ fields: { max_raise: expect.any(String) } });
  });

  it('rejects max_contribution less than min_contribution', async () => {
    await expect(
      parseCampaignRequest(
        req({ ...valid, min_contribution: '1000', max_contribution: '10' })
      )
    ).rejects.toMatchObject({
      fields: { max_contribution: expect.any(String) },
    });
  });

  it('rejects an invalid date string', async () => {
    await expect(
      parseCampaignRequest(req({ ...valid, start_date: 'not-a-date' }))
    ).rejects.toMatchObject({ fields: { start_date: expect.any(String) } });
  });
});

describe('parseMilestonesRequest', () => {
  it('accepts a single milestone with only a name', async () => {
    const result = await parseMilestonesRequest(
      req({ milestones: [{ name: 'Milestone 1' }] })
    );
    expect(result.milestones).toEqual([
      {
        name: 'Milestone 1',
        cost: undefined,
        endDate: undefined,
        componentExternalIds: [],
      },
    ]);
  });

  it('rejects an empty milestones array', async () => {
    await expect(
      parseMilestonesRequest(req({ milestones: [] }))
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fields: { milestones: expect.any(String) },
    });
  });

  it('attributes a per-item error to the correct milestones.<index>.<field> path', async () => {
    await expect(
      parseMilestonesRequest(
        req({
          milestones: [{ name: 'Valid' }, { name: '' }],
        })
      )
    ).rejects.toMatchObject({
      fields: { 'milestones.1.name': expect.any(String) },
    });
  });

  it('parses optional cost, end_date, and component_external_ids', async () => {
    const result = await parseMilestonesRequest(
      req({
        milestones: [
          {
            name: 'Milestone 1',
            cost: '500',
            end_date: '2026-06-01',
            component_external_ids: ['tower', 'rotor_blades'],
          },
        ],
      })
    );
    expect(result.milestones[0]).toMatchObject({
      name: 'Milestone 1',
      cost: '500',
      componentExternalIds: ['tower', 'rotor_blades'],
    });
    expect(result.milestones[0]!.endDate).toBeInstanceOf(Date);
  });
});
