import * as VideoThumbnails from 'expo-video-thumbnails';

import { resolveVideoAssetUri } from '@utils/videoAssetUri';

const moduleCache = new Map<number, string>();
const uriCache = new Map<string, string>();

function cacheKeyForSource(source: number | string): string {
  return typeof source === 'number' ? `module:${source}` : `uri:${source}`;
}

/**
 * Generate (and cache) a poster frame for a bundled require() module or remote HTTPS URL.
 */
export async function getVideoThumbnailUri(
  source: number | string,
  timeMs = 800,
): Promise<string> {
  if (typeof source === 'number') {
    const cached = moduleCache.get(source);
    if (cached) return cached;

    const videoUri = await resolveVideoAssetUri(source);
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: timeMs,
      quality: 0.7,
    });
    moduleCache.set(source, uri);
    return uri;
  }

  const cached = uriCache.get(source);
  if (cached) return cached;

  const { uri } = await VideoThumbnails.getThumbnailAsync(source, {
    time: timeMs,
    quality: 0.7,
  });
  uriCache.set(source, uri);
  return uri;
}

export function peekVideoThumbnail(source: number | string): string | undefined {
  if (typeof source === 'number') return moduleCache.get(source);
  return uriCache.get(source);
}

export function prefetchVideoThumbnail(source: number | string | null | undefined): void {
  if (source == null) return;
  if (typeof source === 'number' || (typeof source === 'string' && source.startsWith('http'))) {
    void getVideoThumbnailUri(source).catch(() => undefined);
  }
}

/** @deprecated use cacheKey helpers via peek/get */
export function peekCachedKey(source: number | string): string {
  return cacheKeyForSource(source);
}
