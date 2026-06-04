import { NextResponse } from 'next/server';

/**
 * Creates a one-time Shield encryption session for Openfort embedded-wallet
 * automatic recovery. Mirrors Openfort's Vercel recovery template; secrets stay server-side.
 *
 * @see https://www.openfort.io/docs/products/embedded-wallet/server/automatic-recovery-session
 */
export async function POST() {
  const publishable =
    process.env.OPENFORT_SHIELD_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_OPENFORT_SHIELD_PUBLISHABLE_KEY?.trim();
  const secret = process.env.OPENFORT_SHIELD_SECRET_KEY?.trim();
  const encryptionShare = process.env.OPENFORT_SHIELD_ENCRYPTION_SHARE?.trim();

  if (!publishable || !secret || !encryptionShare) {
    return NextResponse.json(
      {
        error:
          'Shield encryption session is not configured. Set OPENFORT_SHIELD_SECRET_KEY, OPENFORT_SHIELD_ENCRYPTION_SHARE, and OPENFORT_SHIELD_PUBLISHABLE_KEY (or NEXT_PUBLIC_OPENFORT_SHIELD_PUBLISHABLE_KEY).',
      },
      { status: 500 }
    );
  }

  try {
    const r = await fetch(
      'https://shield.openfort.io/project/encryption-session',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': publishable,
          'x-api-secret': secret,
        },
        body: JSON.stringify({
          encryption_part: encryptionShare,
        }),
      }
    );

    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json(
        {
          error: 'Shield rejected the encryption session request.',
          detail: text,
        },
        { status: 502 }
      );
    }

    const json = (await r.json()) as { session_id?: string };
    const session = json.session_id;
    if (typeof session !== 'string' || !session) {
      return NextResponse.json(
        { error: 'Invalid Shield response: missing session_id' },
        { status: 502 }
      );
    }

    return NextResponse.json({ session });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to reach Shield', detail: message },
      { status: 500 }
    );
  }
}
