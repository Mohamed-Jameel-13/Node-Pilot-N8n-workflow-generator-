import ipaddr from 'ipaddr.js';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254',
  'metadata.google.internal',
  'instance-data'
]);

export function validateSafeUrl(urlString: string): URL {
  if (!urlString || typeof urlString !== 'string') {
    throw new Error('URL string is required');
  }

  let parsed: URL;
  try {
    parsed = new URL(urlString.trim());
  } catch {
    throw new Error('Invalid URL format');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS protocols are allowed');
  }

  const host = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.internal') || host.endsWith('.local')) {
    throw new Error('Target hostname is restricted for security reasons');
  }

  // Check if hostname is an IPv4 or IPv6 literal
  if (ipaddr.isValid(host)) {
    const addr = ipaddr.parse(host);
    const range = addr.range();
    const unsafeRanges = [
      'loopback',
      'private',
      'linkLocal',
      'uniqueLocal',
      'carrierGradeNat',
      'reserved',
      'broadcast'
    ];
    if (unsafeRanges.includes(range)) {
      throw new Error('Target IP address is in a restricted range');
    }
  }

  return parsed;
}
