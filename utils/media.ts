import type { ImageSourcePropType } from 'react-native';

const EMPTY_PLACEHOLDER_URI =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export function isRemoteMediaUrl(url?: string | null): boolean {
  if (!url) return false;
  const value = url.trim();
  return value.startsWith('http://') || value.startsWith('https://');
}

export function isEmptyPlaceholderUri(url?: string | null): boolean {
  if (!url) return true;
  return (
    url.startsWith('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP') ||
    url.trim().length === 0
  );
}

/**
 * Normalize any media reference for Expo Image rendering.
 * Only absolute HTTPS/HTTP (Cloudflare R2) URLs are valid catalog media.
 */
export function normalizeMediaUrl(
  url?: string | null,
  options?: { updatedAt?: string | number | Date | null },
): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();

  if (!isRemoteMediaUrl(trimmed)) {
    if (__DEV__) {
      console.warn('[media] Ignoring non-remote image URL:', trimmed);
    }
    return null;
  }

  if (!options?.updatedAt) return trimmed;

  const stamp =
    options.updatedAt instanceof Date
      ? options.updatedAt.getTime()
      : typeof options.updatedAt === 'number'
        ? options.updatedAt
        : new Date(options.updatedAt).getTime();

  if (!Number.isFinite(stamp)) return trimmed;
  const sep = trimmed.includes('?') ? '&' : '?';
  // Strip prior v=/updated= then append fresh cache buster
  const base = trimmed.replace(/([?&])(v|updated)=\d+/g, '').replace(/[?&]$/, '');
  return `${base}${base.includes('?') ? '&' : '?'}${`v=${stamp}`}`;
}

export function mediaSource(
  url?: string | null,
  options?: { updatedAt?: string | number | Date | null },
): ImageSourcePropType | null {
  const normalized = normalizeMediaUrl(url, options);
  if (!normalized) return null;
  return { uri: normalized };
}

export function logImageLoadError(
  context: string,
  meta: { productId?: string; url?: string | null; error?: unknown },
): void {
  if (!__DEV__) return;
  console.warn(`[image:${context}]`, {
    productId: meta.productId,
    url: meta.url,
    error: meta.error instanceof Error ? meta.error.message : meta.error,
  });
}

export const MEDIA_EMPTY_URI = EMPTY_PLACEHOLDER_URI;
