import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { endpointUrl, apiToken } = await request.json();

    if (!endpointUrl || !apiToken) {
      return NextResponse.json({ success: false, error: 'Missing endpoint or token' }, { status: 400 });
    }

    const url = endpointUrl.endsWith('/') ? endpointUrl.slice(0, -1) : endpointUrl;
    
    // Ping the n8n workflows endpoint to test auth
    const response = await fetch(`${url}/api/v1/workflows`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': apiToken,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Authentication failed or endpoint unreachable' }, { status: response.status });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
