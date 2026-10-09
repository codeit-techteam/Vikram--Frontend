type QuoteLine = { productId?: string | null; variantId?: string | null; quantity: number };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function lineKey(line: QuoteLine): string {
  const variant = line.variantId && UUID_RE.test(line.variantId) ? line.variantId : '';
  return `${line.productId ?? ''}:${variant}`;
}

function tally(lines: QuoteLine[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const line of lines) {
    const key = lineKey(line);
    totals.set(key, (totals.get(key) ?? 0) + Number(line.quantity || 0));
  }
  return totals;
}

/**
 * The server prices its own cart. Only accept a quote whose lines equal what the
 * customer sees locally, otherwise the payable amount would not match the screen.
 */
export function quoteMatchesCart(
  serverLines: QuoteLine[] | undefined,
  localLines: QuoteLine[],
): boolean {
  if (!serverLines) return false;
  const server = tally(serverLines);
  const local = tally(localLines);
  if (server.size !== local.size) return false;
  for (const [key, qty] of local) {
    if (server.get(key) !== qty) return false;
  }
  return true;
}

/** Transient failures worth one automatic retry; validation errors are not. */
export function isRetryableQuoteError(error: unknown): boolean {
  const value = (error ?? {}) as { code?: string; statusCode?: number };
  if (value.code === 'CANCELLED') return false;
  if (value.code === 'TIMEOUT' || value.code === 'NETWORK' || value.code === 'CART_OUT_OF_SYNC') {
    return true;
  }
  return typeof value.statusCode === 'number' && (value.statusCode === 0 || value.statusCode >= 500);
}

export const QUOTE_RETRY_DELAY_MS = 1500;
export const QUOTE_MAX_ATTEMPTS = 2;
