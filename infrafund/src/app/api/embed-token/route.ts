import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get('reportId') || '2bfcg54d-e11e-44a9-8c14-1374af9530ba';
  const workspaceId = '4d74333d-77aa-461f-85e7-e125a9782e07';
  const accessToken = process.env.POWERBI_ACCESS_TOKEN;

  try {
    const response = await axios.post(
      `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`,
      { accessLevel: 'View' },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return NextResponse.json({ embedToken: response.data.token });
  } catch (error) {
    return NextResponse.json({ error: 'Token generation failed' }, { status: 500 });
  }
}