import type { ImageSourcePropType } from 'react-native';

import {
  isEmptyPlaceholderUri,
  mediaSource,
  normalizeMediaUrl,
} from '@utils/media';

/**
 * Resolve category image — Cloudflare R2 HTTPS URLs only.
 */
export function resolveCategoryImageSource(
  _slug: string,
  imageUrl?: string | null,
): ImageSourcePropType {
  return mediaSource(imageUrl) ?? { uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' };
}

/**
 * Resolve product image — remote HTTPS (R2) only.
 */
export function resolveProductImageSource(opts: {
  imageUrl?: string | null;
  productSlug?: string | null;
  categorySlug?: string | null;
  productName?: string | null;
  fallbackImage?: ImageSourcePropType;
  updatedAt?: string | number | Date | null;
}): ImageSourcePropType {
  const remote = mediaSource(opts.imageUrl, { updatedAt: opts.updatedAt });
  if (remote) return remote;

  if (
    opts.fallbackImage &&
    typeof opts.fallbackImage === 'object' &&
    'uri' in opts.fallbackImage &&
    typeof opts.fallbackImage.uri === 'string' &&
    normalizeMediaUrl(opts.fallbackImage.uri)
  ) {
    return opts.fallbackImage;
  }

  return {
    uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  };
}

export function resolveProductCarouselSources(opts: {
  urls?: string[];
  imageUrl?: string | null;
  productSlug?: string | null;
  categorySlug?: string | null;
  updatedAt?: string | number | Date | null;
}): ImageSourcePropType[] {
  const sources: ImageSourcePropType[] = [];
  for (const url of opts.urls ?? []) {
    const source = mediaSource(url, { updatedAt: opts.updatedAt });
    if (source) sources.push(source);
  }
  if (sources.length > 0) return sources;

  return [
    resolveProductImageSource({
      imageUrl: opts.imageUrl,
      productSlug: opts.productSlug,
      categorySlug: opts.categorySlug,
      updatedAt: opts.updatedAt,
    }),
  ];
}

export function hasRenderableMediaUrl(url?: string | null): boolean {
  const normalized = normalizeMediaUrl(url);
  return Boolean(normalized) && !isEmptyPlaceholderUri(normalized);
}

/** @deprecated Local asset maps removed — kept empty for older imports. */
export const CATEGORY_PLACEHOLDER_MAP: Record<string, ImageSourcePropType> = {};
export const PRODUCT_PLACEHOLDER_MAP: Record<string, ImageSourcePropType> = {};
export const ASSET_PATH_MAP: Record<string, ImageSourcePropType> = {};
export const PRODUCT_SLUG_MAP: Record<string, ImageSourcePropType> = {};
