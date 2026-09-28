import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateSafeUrl } from '@/lib/ssrf';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { endpointUrl, apiToken } = await request.json();

    if (!endpointUrl || !apiToken) {
      return NextResponse.json({ success: false, error: 'Missing endpoint or token' }, { status: 400 });
    }

    let safeUrl: URL;
    try {
      safeUrl = validateSafeUrl(endpointUrl);
    } catch (urlErr: any) {
      return NextResponse.json({ success: false, error: urlErr.message || 'Restricted endpoint URL' }, { status: 403 });
    }

    const url = safeUrl.toString().replace(/\/+$/, '');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${url}/api/v1/workflows?limit=1`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'X-N8N-API-KEY': apiToken.trim(),
        'Accept': 'application/json',
        'User-Agent': 'NodePilot-ControlPlane/1.0'
      }
    });
    clearTimeout(timeout);

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
    return NextResponse.json({ success: false, error: error.message || 'Connection failed' }, { status: 500 });
  }
}
