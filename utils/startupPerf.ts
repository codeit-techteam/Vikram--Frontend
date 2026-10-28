/**
 * Sanitized startup timing marks for diagnosing cold-launch issues.
 * Never logs tokens, PII, or request/response bodies.
 */

type StartupMark =
  | 'process'
  | 'js_ready'
  | 'root_mount'
  | 'session_local'
  | 'session_network'
  | 'api_client'
  | 'nav_ready'
  | 'first_shell'
  | 'first_home_content'
  | 'splash_hide';

const t0 =
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

const marks = new Map<string, number>();

function nowMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

export function markStartup(name: StartupMark | string): void {
  const elapsed = Math.round(nowMs() - t0);
  marks.set(name, elapsed);
  if (__DEV__) {
    console.log(`[startup] +${elapsed}ms ${name}`);
  }
}

export function getStartupMarks(): Record<string, number> {
  return Object.fromEntries(marks.entries());
}

/** Wall-clock ms since JS module evaluation of this file. */
export function startupElapsedMs(): number {
  return Math.round(nowMs() - t0);
}

markStartup('js_ready');
