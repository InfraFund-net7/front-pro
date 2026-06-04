import { getServerUrl } from '@/utils/get-server-url';
import backend from '@/utils/server-axios';
import { NextRequest, NextResponse } from 'next/server';

function appendSetCookies(
  next: NextResponse,
  setCookie: string | string[] | undefined
) {
  if (!setCookie) return;
  const list = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const c of list) {
    next.headers.append('Set-Cookie', c);
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const upstreamUrl = getServerUrl('auth/register');
  if (!upstreamUrl) {
    return NextResponse.json(
      {
        message:
          'Missing NEXT_PUBLIC_API_BASE_URL (or SERVER_URL) in front-pro environment.',
      },
      { status: 500 }
    );
  }
  try {
    const res = await backend.post(upstreamUrl, payload, {
      validateStatus: () => true,
    });
    const next = NextResponse.json(res.data, { status: res.status });
    appendSetCookies(next, res.headers['set-cookie']);
    return next;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Upstream error', detail },
      { status: 502 }
    );
  }
}
