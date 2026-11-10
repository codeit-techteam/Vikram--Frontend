/**
 * Request timing + dedupe counters for diagnosing slow screens.
 * Never logs tokens, Authorization headers, or response bodies.
 */

type PerfSample = {
  endpoint: string;
  method: string;
  status: number | 'NETWORK' | 'TIMEOUT' | 'CANCELLED';
  durationMs: number;
  requestId: string;
};

const recent: PerfSample[] = [];
const MAX_SAMPLES = 80;
const inFlightByKey = new Map<string, number>();

let seq = 0;

export function nextRequestId(): string {
  seq += 1;
  return `rq_${Date.now().toString(36)}_${seq}`;
}

function sanitizeEndpoint(url: string): string {
  try {
    const withoutHost = url.replace(/^https?:\/\/[^/]+/i, '');
    return withoutHost.split('?')[0] || withoutHost || '/';
  } catch {
    return '/';
  }
}

export function markRequestStart(method: string, url: string): string {
  const requestId = nextRequestId();
  const key = `${method.toUpperCase()} ${sanitizeEndpoint(url)}`;
  inFlightByKey.set(key, (inFlightByKey.get(key) ?? 0) + 1);
  return requestId;
}

export function markRequestEnd(input: {
  requestId: string;
  method: string;
  url: string;
  startedAt: number;
  status: number | 'NETWORK' | 'TIMEOUT' | 'CANCELLED';
}): void {
  const endpoint = sanitizeEndpoint(input.url);
  const method = input.method.toUpperCase();
  const key = `${method} ${endpoint}`;
  const inflight = inFlightByKey.get(key) ?? 1;
  inFlightByKey.set(key, Math.max(0, inflight - 1));

  const durationMs = Math.max(0, Math.round(Date.now() - input.startedAt));
  const sample: PerfSample = {
    endpoint,
    method,
    status: input.status,
    durationMs,
    requestId: input.requestId,
  };

  recent.push(sample);
  if (recent.length > MAX_SAMPLES) recent.shift();

  const duplicateHint = inflight > 1 ? ` inflight=${inflight}` : '';
  // Always log timing so release Logcat can diagnose production APK slowness.
  console.log(
    `[perf] ${sample.requestId} ${method} ${endpoint} ${String(sample.status)} ${durationMs}ms${duplicateHint}`,
  );
}

export function getRecentApiPerf(): PerfSample[] {
  return [...recent];
}

export function getInFlightApiCounts(): Record<string, number> {
  return Object.fromEntries(
    [...inFlightByKey.entries()].filter(([, count]) => count > 0),
  );
}
