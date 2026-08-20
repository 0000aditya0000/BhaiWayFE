import { env } from '@/config';

const formatJson = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

/** Truncate secrets for console logs (JWT / MSG91 tokens). */
export const redactSecret = (value: unknown, keep = 24): unknown => {
  if (typeof value !== 'string' || value.length <= keep) {
    return value;
  }
  return `${value.slice(0, keep)}…`;
};

const maskIdentityValue = (key: string, value: unknown): unknown => {
  const lower = key.toLowerCase();
  if (typeof value !== 'string') {
    return value;
  }
  if (
    lower.includes('aadhaar') ||
    lower.includes('aadhar') ||
    lower.includes('documentnumber') ||
    lower.includes('licensenumber') ||
    lower.includes('accountnumber') ||
    lower.includes('registrationnumber') ||
    lower.includes('platenumber') ||
    lower.includes('vehiclenumber')
  ) {
    if (value.length <= 4) {
      return '****';
    }
    // Keep first 2 + last 2 visible for plate/reg debugging; mask the middle.
    if (
      lower.includes('registration') ||
      lower.includes('plate') ||
      lower.includes('vehicle')
    ) {
      return `${value.slice(0, 2)}**${'*'.repeat(Math.max(2, value.length - 4))}**${value.slice(-2)}`;
    }
    return `${'*'.repeat(Math.max(4, value.length - 4))}${value.slice(-4)}`;
  }
  return value;
};

const redactDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(redactDeep);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const out: Record<string, unknown> = {};
  for (const [key, next] of Object.entries(value as Record<string, unknown>)) {
    const lower = key.toLowerCase();
    if (
      lower.includes('token') ||
      lower === 'authorization' ||
      lower.includes('password') ||
      lower.includes('secret') ||
      lower.includes('otp')
    ) {
      if (typeof next === 'string' && next.toLowerCase().startsWith('bearer ')) {
        out[key] = `Bearer ${redactSecret(next.slice(7).trim())}`;
      } else {
        out[key] = redactSecret(next);
      }
      continue;
    }
    if (lower === 'email' || lower.endsWith('email')) {
      out[key] = typeof next === 'string' && next.length > 0 ? '[redacted]' : next;
      continue;
    }
    out[key] = redactDeep(maskIdentityValue(key, next));
  }
  return out;
};

type ApiLogKind = 'Auth' | 'Users' | 'Vehicles' | 'Verification';

const resolveKind = (path: string): ApiLogKind | null => {
  if (path.startsWith('/auth/')) {
    return 'Auth';
  }
  if (path.startsWith('/users')) {
    return 'Users';
  }
  if (path.startsWith('/vehicles')) {
    return 'Vehicles';
  }
  if (path.startsWith('/verification')) {
    return 'Verification';
  }
  return null;
};

const statusLabel = (status?: number): string => {
  if (status == null) {
    return '—';
  }
  const labels: Record<number, string> = {
    200: '200 OK',
    201: '201 Created',
    400: '400 Bad Request',
    401: '401 Unauthorized',
    403: '403 Forbidden',
    404: '404 Not Found',
    409: '409 Conflict',
    422: '422 Unprocessable Entity',
    500: '500 Internal Server Error',
  };
  return labels[status] ?? String(status);
};

/**
 * Readable console logs for documented BhaiWay Auth / Vehicles / Verification APIs.
 * Docs: BhaiWay_Backend_API_Documentation.md
 * Enabled when `env.enableLogging` (non-production).
 */
export const logApiExchange = (input: {
  phase: 'request' | 'response' | 'error';
  method: string;
  path: string;
  url?: string;
  status?: number;
  durationMs?: number;
  headers?: Record<string, string>;
  body?: unknown;
  errorMessage?: string;
}): void => {
  if (!env.enableLogging) {
    return;
  }

  const kind = resolveKind(input.path);
  if (!kind) {
    return;
  }

  const authHeader = input.headers?.Authorization ?? input.headers?.authorization;
  const hasBearer = typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ');
  const contentType =
    input.headers?.['Content-Type'] ?? input.headers?.['content-type'] ?? 'application/json';

  const safeHeaders = redactDeep(input.headers ?? {}) as Record<string, unknown>;
  const safeBody = redactDeep(input.body ?? null);

  const pathLower = input.path.toLowerCase();
  let topic = kind.toUpperCase();
  let icon =
    input.phase === 'request' ? '🔐' : input.phase === 'response' ? '✅' : '❌';
  if (pathLower.includes('/verification/driving-license')) {
    topic = 'DRIVING LICENSE';
    if (input.phase === 'request') {
      icon = '🚘';
    }
  } else if (pathLower.includes('/verification/identity')) {
    topic = 'IDENTITY VERIFICATION';
  } else if (pathLower.includes('/verification/vehicle')) {
    topic = 'VEHICLE VERIFICATION';
    if (input.phase === 'request') {
      icon = '🚗';
    }
  } else if (pathLower === '/verification/me' || pathLower.endsWith('/verification/me')) {
    topic = 'VERIFICATION ME';
  }

  const phaseTitle =
    input.phase === 'request'
      ? `${topic} API REQUEST`
      : input.phase === 'response'
        ? `${topic} API RESPONSE`
        : `${topic} API ERROR`;

  const lines = [
    '',
    '══════════════════════════════════════════════════',
    `${icon} ${phaseTitle}`,
    '══════════════════════════════════════════════════',
    `Method       : ${input.method}`,
    `Endpoint     : ${input.path}`,
    `URL          : ${input.url ?? '—'}`,
  ];

  if (input.phase === 'request') {
    lines.push(`Auth         : ${hasBearer ? 'Bearer Token Present' : 'None'}`);
    lines.push(`Content-Type : ${contentType}`);
    lines.push('');
    lines.push('Request Body:');
    lines.push(formatJson(safeBody));
  } else if (input.phase === 'response') {
    lines.push(`Status       : ${statusLabel(input.status)}`);
    if (input.durationMs != null) {
      lines.push(`Duration     : ${input.durationMs} ms`);
    }
    lines.push(`Auth         : ${hasBearer ? 'Bearer Token Present' : 'None'}`);
    lines.push('');
    lines.push('Response:');
    lines.push(formatJson(safeBody));
  } else {
    lines.push(`Status       : ${statusLabel(input.status)}`);
    if (input.durationMs != null) {
      lines.push(`Duration     : ${input.durationMs} ms`);
    }
    lines.push('');
    lines.push('Error Response:');
    lines.push(formatJson(safeBody));
    if (input.errorMessage) {
      lines.push('');
      lines.push('Error Message:');
      lines.push(input.errorMessage);
    }
  }

  if (input.phase === 'request' && hasBearer) {
    lines.push('');
    lines.push(`Authorization: ${String(safeHeaders.Authorization ?? safeHeaders.authorization ?? 'Bearer …')}`);
  }

  lines.push('══════════════════════════════════════════════════');
  lines.push('');

  console.log(lines.join('\n'));
};
