import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// System prompt instructing the AI model how to act as the n8n Orchestration Specialist
const SYSTEM_PROMPT = `You are NodePilot, an AI-powered control plane assistant for n8n workflow automation.
You help users inspect, debug, create, and modify n8n workflows using natural language.

When assisting users with workflow tasks:
1. Be helpful, clear, and direct.
2. If asked to inspect or fix a workflow, analyze the user's workflow goals, node configurations, and logic.
3. Suggest concrete fixes, node additions, or parameter adjustments.
4. When suggesting workflow structure changes, summarize the workflow steps clearly with node names and parameters.`;

export async function POST(request: Request) {
  try {
    const { messages, canvasState, aiProviders, n8nConfig } = await request.json();

    // Check if user has configured BYOK providers
    let apiKey = process.env.OPENROUTER_API_KEY || "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";
    let baseUrl = "https://openrouter.ai/api/v1";
    let model = "openrouter/auto";

    if (aiProviders && Array.isArray(aiProviders) && aiProviders.length > 0) {
      const activeProvider = aiProviders[0];
      if (activeProvider.apiKey) apiKey = activeProvider.apiKey;
      if (activeProvider.baseUrl) baseUrl = activeProvider.baseUrl;
      if (activeProvider.model) model = activeProvider.model;
    }

    let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    if (!url.endsWith('/v1') && !url.includes('/api/v1') && !url.includes('openrouter.ai')) {
      url = `${url}/v1`;
    }
    const endpoint = `${url}/chat/completions`;

    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(Array.isArray(messages) ? messages : [])
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nodepilot.pages.dev',
        'X-Title': 'NodePilot Control Plane'
      },
      body: JSON.stringify({
        model: model,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const errorText = await response.text();
      return NextResponse.json({ 
        error: `AI Provider Error (HTTP ${response.status}): ${errorText.slice(0, 150)}` 
      }, { status: response.status });
    }
  } catch (error: any) {
    return NextResponse.json({ error: `Internal AI Chat Error: ${error.message}` }, { status: 500 });
  }
}
