import type { ImageSourcePropType } from 'react-native';

import { images } from '@constants/images';
import {
  isEmptyPlaceholderUri,
  mediaSource,
  normalizeMediaUrl,
} from '@utils/media';

const LOCAL_CATEGORY_FALLBACKS: Record<string, ImageSourcePropType> = {
  rmc: images.categoryRmc,
  steel: images.categoryRmc, // legacy slug → RMC visual
  bricks: images.categoryBricks,
};

const LOCAL_PRODUCT_FALLBACKS: Record<string, ImageSourcePropType> = {
  'red-bricks-a-plus': images.productRedBricksAPlus,
  'red-bricks': images.productRedBricks,
  'red-bricks-b-plus': images.productRedBricksBPlus,
  'red-clay-bricks': images.productRedBricksAPlus,
  'grey-ash-bricks-a-plus': images.productGreyAshBricksAPlus,
  'grey-ash-bricks-a': images.productGreyAshBricksAPlus,
  'grey-ash-bricks-b-plus': images.productGreyAshBricksBPlus,
  'grey-flash-cement-bricks': images.productGreyFlashCementBricks,
};

/**
 * Resolve category image — prefer Cloudflare R2 HTTPS; fall back to bundled
 * RMC asset so the mixer truck shows before/without a successful R2 migrate.
 */
export function resolveCategoryImageSource(
  slug: string,
  imageUrl?: string | null,
): ImageSourcePropType {
  const remote = mediaSource(imageUrl);
  if (remote) return remote;

  const key = slug.trim().toLowerCase();
  if (LOCAL_CATEGORY_FALLBACKS[key]) {
    return LOCAL_CATEGORY_FALLBACKS[key];
  }

  return {
    uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  };
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

  const slugKey = (opts.productSlug ?? '').trim().toLowerCase();
  if (slugKey && LOCAL_PRODUCT_FALLBACKS[slugKey]) {
    return LOCAL_PRODUCT_FALLBACKS[slugKey];
  }

  const categoryKey = (opts.categorySlug ?? '').trim().toLowerCase();
  if (categoryKey === 'rmc' || categoryKey === 'steel') {
    return images.categoryRmc;
  }
  if (categoryKey === 'bricks') {
    return images.categoryBricks;
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
