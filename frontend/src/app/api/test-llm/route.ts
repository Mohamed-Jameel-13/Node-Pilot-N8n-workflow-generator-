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

    const { baseUrl, apiKey } = await request.json();

    if (!baseUrl || !apiKey) {
      return NextResponse.json({ success: false, error: 'Missing Base URL or API Key' }, { status: 400 });
    }

    let safeUrl: URL;
    try {
      safeUrl = validateSafeUrl(baseUrl);
    } catch (urlErr: any) {
      return NextResponse.json({ success: false, error: urlErr.message || 'Restricted Base URL' }, { status: 403 });
    }

    let url = safeUrl.toString().replace(/\/+$/, '');
    if (!url.endsWith('/v1') && !url.includes('/api/v1')) {
      url = `${url}/v1`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${url}/models`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'NodePilot-ControlPlane/1.0'
      }
    });
    clearTimeout(timeout);

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
