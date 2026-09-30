export class DeadlineExceededError extends Error {
  readonly code = 'TIMEOUT';

  constructor(message: string) {
    super(message);
    this.name = 'DeadlineExceededError';
  }
}

/**
 * Rejects when `task` has not settled within `ms`, so a stalled request chain
 * can never hold a loading flag forever. The underlying work is aborted via `controller`.
 */
export function withDeadline<T>(
  task: Promise<T>,
  ms: number,
  message: string,
  controller?: AbortController,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller?.abort();
      reject(new DeadlineExceededError(message));
    }, ms);
  });
  return Promise.race([task, deadline]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
