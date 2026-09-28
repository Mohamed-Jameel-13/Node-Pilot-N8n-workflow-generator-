/**
 * Razorpay REST API helper using native fetch()
 * Replaces the razorpay npm package for Cloudflare Workers compatibility
 */

function getRazorpayAuth(env?: Record<string, any>): string {
  const keyId = env?.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';
  const keySecret = env?.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || '';
  return 'Basic ' + btoa(`${keyId}:${keySecret}`);
}

const BASE_URL = 'https://api.razorpay.com/v1';

async function rzpFetch(path: string, method = 'GET', body?: object, env?: Record<string, any>) {
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': getRazorpayAuth(env),
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, options);

  const data = await res.json() as any;
  if (!res.ok) {
    throw { description: data?.error?.description || 'Razorpay API error', ...data?.error };
  }
  return data;
}

export const getRazorpayClient = (env?: Record<string, any>) => ({
  plans: {
    all: () => rzpFetch('/plans', 'GET', undefined, env),
    create: (body: object) => rzpFetch('/plans', 'POST', body, env),
  },
  subscriptions: {
    create: (body: object) => rzpFetch('/subscriptions', 'POST', body, env),
    fetch: (id: string) => rzpFetch(`/subscriptions/${id}`, 'GET', undefined, env),
    cancel: (id: string) => rzpFetch(`/subscriptions/${id}/cancel`, 'POST', undefined, env),
  },
});

export const razorpay = getRazorpayClient();
