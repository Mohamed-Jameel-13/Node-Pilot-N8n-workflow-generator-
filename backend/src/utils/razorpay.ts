/**
 * Razorpay REST API helper using native fetch()
 * Replaces the razorpay npm package for Cloudflare Workers compatibility
 */

function getRazorpayAuth(): string {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  return 'Basic ' + btoa(`${keyId}:${keySecret}`);
}

const BASE_URL = 'https://api.razorpay.com/v1';

async function rzpFetch(path: string, method = 'GET', body?: object) {
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': getRazorpayAuth(),
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

export const razorpay = {
  plans: {
    all: () => rzpFetch('/plans'),
    create: (body: object) => rzpFetch('/plans', 'POST', body),
  },
  subscriptions: {
    create: (body: object) => rzpFetch('/subscriptions', 'POST', body),
    fetch: (id: string) => rzpFetch(`/subscriptions/${id}`),
    cancel: (id: string) => rzpFetch(`/subscriptions/${id}/cancel`, 'POST'),
  },
};
