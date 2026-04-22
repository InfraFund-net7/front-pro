import { getServerUrl } from '@/utils/get-server-url';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BodySchema = z.object({
  wallet_address: z.string().min(1),
  challenge_type: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const headers = request.headers;
    const parsed = BodySchema.parse(payload);
    const { data, status } = await axios.post(
      getServerUrl(`auth/challenge`),
      parsed,
      {
        headers: {
          Authorization: headers.get('Authorization') ?? '',
        },
      }
    );

    return NextResponse.json(data, { status: status || 200 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.issues }, { status: 400 });
    }

    if (axios.isAxiosError(err)) {
      return NextResponse.json(
        { message: err.response?.data?.message || err.message },
        { status: err.response?.status || 500 }
      );
    }

    console.error('Challenge error:', err);

    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
