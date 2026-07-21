import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { baseUrl, apiKey } = await request.json();

    if (!baseUrl || !apiKey) {
      return NextResponse.json({ success: false, error: 'Missing Base URL or API Key' }, { status: 400 });
    }

    let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    if (!url.endsWith('/v1') && !url.includes('/api/v1')) {
      // Append /v1 if missing for standard OpenAI-compatible endpoints
      url = `${url}/v1`;
    }

    const response = await fetch(`${url}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'NodePilot-ControlPlane/1.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const models = data.data || data.models || [];
      return NextResponse.json({ success: true, data: models });
    } else {
      const errorText = await response.text();
      return NextResponse.json({ 
        success: false, 
        error: `Failed to fetch models (HTTP ${response.status}): ${errorText.slice(0, 100)}` 
      }, { status: 200 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
