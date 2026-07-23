import type { ImageSourcePropType } from 'react-native';
import type { VideoSource } from 'expo-video';

import { images } from '@constants/images';
import { resolveCategoryImageSource } from '@utils/catalogPlaceholders';

/**
 * Maps CMS media references (local asset paths or future CDN URLs)
 * to React Native sources. Storage-agnostic — only the DB value changes later.
 */
const VIDEO_PATH_MAP: Record<string, number> = {
  'assets/videos/delivery-hero.mp4': require('../assets/videos/delivery-hero.mp4'),
  '/assets/videos/delivery-hero.mp4': require('../assets/videos/delivery-hero.mp4'),
  'assets/videos/landscape.mp4': require('../assets/videos/landscape.mp4'),
  '/assets/videos/landscape.mp4': require('../assets/videos/landscape.mp4'),
  'assets/videos/bricks.mp4': require('../assets/videos/bricks.mp4'),
  '/assets/videos/bricks.mp4': require('../assets/videos/bricks.mp4'),
  'assets/videos/unbeatable.mp4': require('../assets/videos/unbeatable.mp4'),
  '/assets/videos/unbeatable.mp4': require('../assets/videos/unbeatable.mp4'),
  'assets/hero-video.mp4': require('../assets/videos/delivery-hero.mp4'),
  '/assets/hero-video.mp4': require('../assets/videos/delivery-hero.mp4'),
};

function normalizePath(path: string): string {
  const trimmed = path.trim();
  return trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
}

function isRemoteUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

export function resolveCmsImageSource(
  path?: string | null,
  fallbackSlug = 'aggregates',
): ImageSourcePropType {
  if (!path) return resolveCategoryImageSource(fallbackSlug);
  if (isRemoteUrl(path)) return { uri: path };

  const withSlash = path.startsWith('/') ? path : `/${path}`;
  const asAssets = withSlash.startsWith('/assets/')
    ? withSlash
    : `/assets/${normalizePath(path).replace(/^assets\//, '')}`;

  return resolveCategoryImageSource(fallbackSlug, asAssets);
}

export function resolveCmsVideoSource(path?: string | null): VideoSource | null {
  if (!path) return null;
  if (isRemoteUrl(path)) return { uri: path };

  const key = path.trim();
  if (VIDEO_PATH_MAP[key]) return VIDEO_PATH_MAP[key];

  const normalized = normalizePath(key);
  if (VIDEO_PATH_MAP[normalized]) return VIDEO_PATH_MAP[normalized];
  if (VIDEO_PATH_MAP[`/${normalized}`]) return VIDEO_PATH_MAP[`/${normalized}`];

  return null;
}

export function resolveCmsVideoModule(path?: string | null): number | null {
  const source = resolveCmsVideoSource(path);
  return typeof source === 'number' ? source : null;
}

/** Hero/login-style remote banner fallback used by legacy static home. */
export const CMS_DEFAULT_HERO_IMAGE = images.loginBanner;
