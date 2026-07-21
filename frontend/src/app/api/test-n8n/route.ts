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
    
    // Ping the n8n workflows endpoint with valid query param (limit=1) and User-Agent
    const response = await fetch(`${url}/api/v1/workflows?limit=1`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': apiToken,
        'Accept': 'application/json',
        'User-Agent': 'NodePilot-ControlPlane/1.0'
      }
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      let details = "";
      try {
        const errorText = await response.text();
        details = errorText ? ` (${response.status}: ${errorText.slice(0, 100)})` : ` (HTTP ${response.status})`;
      } catch (e) {
        details = ` (HTTP ${response.status})`;
      }
      return NextResponse.json({ 
        success: false, 
        error: response.status === 401 || response.status === 403 
          ? `Invalid API Key (HTTP ${response.status})` 
          : `Failed to connect to n8n${details}` 
      }, { status: 200 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
