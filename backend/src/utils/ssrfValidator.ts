const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254',
  'metadata.google.internal',
  'instance-data'
]);

export function validateExternalUrl(urlString: string): URL {
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
    throw new Error('Only HTTP and HTTPS protocols are supported');
  }

  const host = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTS.has(host) || host.endsWith('.internal') || host.endsWith('.local')) {
    throw new Error('Target hostname is in a restricted range');
  }

  // Deny IPv4 private/loopback/link-local ranges
  const ipParts = host.split('.').map(Number);
  if (ipParts.length === 4 && ipParts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
    const o1 = ipParts[0]!;
    const o2 = ipParts[1]!;
    if (
      o1 === 127 || 
      o1 === 10 || 
      (o1 === 172 && o2 >= 16 && o2 <= 31) || 
      (o1 === 192 && o2 === 168) || 
      (o1 === 169 && o2 === 254) || 
      o1 === 0
    ) {
      throw new Error('Target IP address is in a restricted range');
    }
  }

  return parsed;
}
