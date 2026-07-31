import { API_BASE_URL } from '@services/api';

/**
 * Socket.IO connects to the HTTP origin (not /api/v1).
 * Namespace `/realtime` is appended by the client.
 */
export function resolveSocketOrigin(): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  return base.replace(/\/api\/v\d+$/i, '') || base;
}
