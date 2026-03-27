import { NextRequest, NextResponse } from 'next/server';

const SHIELD_URL = process.env.SHIELD_URL || 'https://shield.openfort.io';
const SHIELD_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SHIELD_API_KEY;
const SHIELD_SECRET_KEY = process.env.SHIELD_SECRET_KEY;
const SHIELD_ENCRYPTION_SHARE = process.env.SHIELD_ENCRYPTION_SHARE;

export async function POST(request: NextRequest) {
  if (
    !SHIELD_PUBLISHABLE_KEY ||
    !SHIELD_SECRET_KEY ||
    !SHIELD_ENCRYPTION_SHARE
  ) {
    return NextResponse.json(
      { message: 'Shield credentials not configured on server' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(`${SHIELD_URL}/project/encryption-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SHIELD_PUBLISHABLE_KEY,
        'x-api-secret': SHIELD_SECRET_KEY,
      },
      body: JSON.stringify({
        encryption_part: SHIELD_ENCRYPTION_SHARE,
        user_id: body.user_id,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Shield encryption session error:', error);
      return NextResponse.json(
        { message: 'Failed to create encryption session' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ session: data.session_id });
  } catch (err) {
    console.error('Encryption session error:', err);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
