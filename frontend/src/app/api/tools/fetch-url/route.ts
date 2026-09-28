import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateSafeUrl } from '@/lib/ssrf';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    // 1. Enforce Authentication
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // 2. Validate URL against SSRF and private networks
    let safeUrl: URL;
    try {
      safeUrl = validateSafeUrl(targetUrl);
    } catch (urlErr: any) {
      return NextResponse.json({ error: urlErr.message || 'Restricted URL' }, { status: 403 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(safeUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NodePilot-ControlPlane/1.0',
        'Accept': 'application/json, text/plain, */*'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json({ data, type: 'json' });
    } else {
      const text = await response.text();
      return NextResponse.json({ data: text.slice(0, 500000), type: 'text' });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: `Internal Server Error: ${error.message}` },
      { status: 500 }
    );
  }
}
