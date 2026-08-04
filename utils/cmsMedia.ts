import type { ImageSourcePropType } from 'react-native';
import type { VideoSource } from 'expo-video';

import { normalizeMediaUrl } from '@utils/media';

/**
 * CMS image resolver — remote CDN / R2 URLs only.
 */
export function resolveCmsImageSource(
  path?: string | null,
): ImageSourcePropType {
  const url = normalizeMediaUrl(path);
  if (url) return { uri: url };
  return {
    uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  };
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

/** Empty placeholder — never use Unsplash/local marketing assets. */
export const CMS_DEFAULT_HERO_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
