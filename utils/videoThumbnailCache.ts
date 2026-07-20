import * as VideoThumbnails from 'expo-video-thumbnails';

import { resolveVideoAssetUri } from '@utils/videoAssetUri';

const thumbnailCache = new Map<number, string>();

export async function getVideoThumbnailUri(
  videoModule: number,
  timeMs = 500,
): Promise<string> {
  const cached = thumbnailCache.get(videoModule);
  if (cached) return cached;

  const videoUri = await resolveVideoAssetUri(videoModule);
  const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time: timeMs });
  thumbnailCache.set(videoModule, uri);
  return uri;
}

export function peekVideoThumbnail(videoModule: number): string | undefined {
  return thumbnailCache.get(videoModule);
}
