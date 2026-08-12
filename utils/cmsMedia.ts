import type { ImageSourcePropType } from 'react-native';
import type { VideoSource } from 'expo-video';

import { isEmptyPlaceholderUri, normalizeMediaUrl } from '@utils/media';

/**
 * CMS image resolver — remote CDN / R2 URLs only.
 * Returns null when missing so callers can fall back to avatars / generated thumbs.
 */
export function resolveCmsImageSource(
  path?: string | null,
): ImageSourcePropType | null {
  const url = normalizeMediaUrl(path);
  if (!url || isEmptyPlaceholderUri(url)) return null;
  return { uri: url };
}

/**
 * CMS video resolver — only HTTPS (Cloudflare R2 / CDN) sources.
 */
export function resolveCmsVideoSource(path?: string | null): VideoSource | null {
  const url = normalizeMediaUrl(path);
  return url ? { uri: url } : null;
}

export function resolveCmsVideoModule(_path?: string | null): number | null {
  return null;
}

export function extractVideoUri(
  source: VideoSource | null | undefined,
): string | null {
  if (!source) return null;
  if (typeof source === 'number') return null;
  if (typeof source === 'string') return source.startsWith('http') ? source : null;
  if (
    typeof source === 'object' &&
    'uri' in source &&
    typeof source.uri === 'string'
  ) {
    return source.uri.startsWith('http') ? source.uri : null;
  }
  return null;
}

/** Empty placeholder — never use Unsplash/local marketing assets. */
export const CMS_DEFAULT_HERO_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
