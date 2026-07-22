import type { ImageSourcePropType } from 'react-native';

import { images } from '@constants/images';

/** Local category placeholders keyed by slug. */
const CATEGORY_PLACEHOLDER_MAP: Record<string, ImageSourcePropType> = {
  cement: images.categoryCement,
  steel: images.categorySteel,
  hardware: images.categoryAggregates,
  tiles: images.categoryAggregates,
  paint: images.categoryPutty,
  adhesives: images.categoryAdhesives,
  aggregates: images.categoryAggregates,
  putty: images.categoryPutty,
  sand: images.categorySand,
  bricks: images.categoryBricks,
  'stone-chips': images.categoryStone,
  stone: images.categoryStone,
  'grey-fill-sand': images.categoryGreyFillSand,
  'wall-repair': images.categoryWallRepair,
  waterproofing: images.categoryWaterproofing,
  'quick-repair': images.categoryQuickRepair,
};

/** Local product placeholders keyed by category slug (fallback). */
const PRODUCT_BY_CATEGORY_PLACEHOLDER: Record<string, ImageSourcePropType> = {
  cement: images.productUltratech,
  steel: images.productJswNeosteel,
  hardware: images.productJswNeosteel,
  tiles: images.productCrushedStoneAggregate,
  paint: images.productAsianPaintsAcrylicPutty,
  adhesives: images.productFevicolMarine,
  aggregates: images.productCrushedStoneAggregate,
  putty: images.productJkWallPutty,
  sand: images.productRiverSand,
  bricks: images.productRedBricks,
  'stone-chips': images.product40mmCrushedStone,
  stone: images.product40mmCrushedStone,
  'grey-fill-sand': images.productDust,
  'wall-repair': images.productJkWallPutty,
  waterproofing: images.productDrFixit301,
  'quick-repair': images.productPolyfix,
};

/**
 * Maps DB imageUrl paths (/assets/...) → local require() assets.
 * Matches prisma/placeholderImageMap.ts until object storage is live.
 */
const ASSET_PATH_MAP: Record<string, ImageSourcePropType> = {
  '/assets/category-cement.png': images.categoryCement,
  '/assets/category-steel.png': images.categorySteel,
  '/assets/category-stone-chips.png': images.categoryStone,
  '/assets/category-sand.png': images.categorySand,
  '/assets/category-bricks.png': images.categoryBricks,
  '/assets/category-grey-fill-sand.png': images.categoryGreyFillSand,
  '/assets/category-aggregates.png': images.categoryAggregates,
  '/assets/category-adhesives.png': images.categoryAdhesives,
  '/assets/category-wall-repair.png': images.categoryWallRepair,
  '/assets/category-waterproofing.png': images.categoryWaterproofing,
  '/assets/category-quick-repair.png': images.categoryQuickRepair,
  '/assets/category-putty.png': images.categoryPutty,
  '/assets/product-ultratech.png': images.productUltratech,
  '/assets/product-ultratech-bags.png': images.productUltratechBags,
  '/assets/product-jsw-neosteel.png': images.productJswNeosteel,
  '/assets/product-acc.png': images.productAcc,
  '/assets/product-crushed-stone-aggregate.png': images.productCrushedStoneAggregate,
  '/assets/product-jeera-rodi.png': images.productJeeraRodi,
  '/assets/product-fevicol-marine.png': images.productFevicolMarine,
  '/assets/product-fevicol-sh.png': images.productFevicolSh,
  '/assets/product-fevicol-pro-bond.png': images.productFevicolProBond,
  '/assets/product-fevicol-sr998.png': images.productFevicolSr998,
  '/assets/product-fevicol-heatx.png': images.productFevicolHeatx,
  '/assets/product-fevicol-speedx.png': images.productFevicolSpeedx,
  '/assets/product-jivantor.png': images.productJivantor,
  '/assets/product-jk-wall-putty.png': images.productJkWallPutty,
  '/assets/product-birla-putty.png': images.productBirlaPutty,
  '/assets/product-sakarni-pop.png': images.productSakarniPop,
  '/assets/product-white-cement.png': images.productWhiteCement,
  '/assets/product-dr-fixit-301.png': images.productDrFixit301,
  '/assets/product-dr-fixit-302.png': images.productDrFixit302,
  '/assets/product-dr-fixit-sure-seal.png': images.productDrFixitSureSeal,
  '/assets/product-dr-fixit-all-seal.png': images.productDrFixitAllSeal,
  '/assets/product-dr-fixit-101-lw.png': images.productDrFixit101Lw,
  '/assets/product-dr-fixit-202-crackx.png': images.productDrFixit202Crackx,
  '/assets/product-polyfix.png': images.productPolyfix,
  '/assets/product-araldite.png': images.productAraldite,
  '/assets/product-fevikwik.png': images.productFevikwik,
  '/assets/product-asian-paints-acrylic-putty.png': images.productAsianPaintsAcrylicPutty,
  '/assets/product-grey-flash-cement-bricks.png': images.productGreyFlashCementBricks,
  '/assets/product-red-bricks.png': images.productRedBricks,
  '/assets/product-tata-tiscon-500d.png': images.productTataTiscon500d,
  '/assets/product-river-sand.png': images.productRiverSand,
  '/assets/product-dust.png': images.productDust,
  '/assets/product-40mm-crushed-stone.png': images.product40mmCrushedStone,
};

/** productSlug → local asset (avoids category fallback when path is missing/stale). */
const PRODUCT_SLUG_MAP: Record<string, ImageSourcePropType> = {
  'ultratech-premium-ppc': images.productUltratech,
  'acc-cement': images.productAcc,
  'cement-opc-53': images.productUltratechBags,
  'tata-tiscon-tmt-500d': images.productTataTiscon500d,
  'jsw-neo-steel-bars': images.productJswNeosteel,
  'sand-dust': images.productDust,
  'river-sand': images.productRiverSand,
  'red-bricks': images.productRedBricks,
  'grey-flash-cement-bricks': images.productGreyFlashCementBricks,
  'grey-fill-sand-grade-1': images.categoryGreyFillSand,
  '20mm-stone-aggregate': images.productCrushedStoneAggregate,
  '40mm-crushed-stone': images.product40mmCrushedStone,
  'jeera-rodi': images.productJeeraRodi,
  'fevicol-marine': images.productFevicolMarine,
  'fevicol-sh': images.productFevicolSh,
  'fevicol-heatx': images.productFevicolHeatx,
  'fevicol-speedx': images.productFevicolSpeedx,
  jivantor: images.productJivantor,
  'fevicol-pro-bond': images.productFevicolProBond,
  'fevicol-sr998': images.productFevicolSr998,
  'jk-wall-putty': images.productJkWallPutty,
  'birla-putty': images.productBirlaPutty,
  'sakarni-pop': images.productSakarniPop,
  'white-cement': images.productWhiteCement,
  'dr-fixit-301-pidicrete-urp': images.productDrFixit301,
  'dr-fixit-302-super-latex': images.productDrFixit302,
  'dr-fixit-sure-seal': images.productDrFixitSureSeal,
  'dr-fixit-all-seal': images.productDrFixitAllSeal,
  'dr-fixit-101-lw': images.productDrFixit101Lw,
  'dr-fixit-202-crack-x-powder': images.productDrFixit202Crackx,
  polyfix: images.productPolyfix,
  araldite: images.productAraldite,
  fevikwik: images.productFevikwik,
  'acrylic-putty': images.productAsianPaintsAcrylicPutty,
};

const DEFAULT_CATEGORY_PLACEHOLDER = images.categoryAggregates;
const DEFAULT_PRODUCT_PLACEHOLDER = images.productUltratech;

function isRemoteUrl(value?: string | null): value is string {
  if (!value) return false;
  return value.startsWith('http://') || value.startsWith('https://');
}

function resolveAssetPath(path?: string | null): ImageSourcePropType | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (ASSET_PATH_MAP[trimmed]) return ASSET_PATH_MAP[trimmed];
  // Tolerate missing leading slash / alternate stone path
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (ASSET_PATH_MAP[normalized]) return ASSET_PATH_MAP[normalized];
  // Filename-only fallback (e.g. product-araldite.png)
  const filename = normalized.split('/').pop();
  if (filename) {
    const byName = `/assets/${filename}`;
    if (ASSET_PATH_MAP[byName]) return ASSET_PATH_MAP[byName];
  }
  if (normalized.includes('category-stone')) return images.categoryStone;
  return null;
}

function resolveByProductSlug(slug?: string | null): ImageSourcePropType | null {
  if (!slug) return null;
  return PRODUCT_SLUG_MAP[slug.trim().toLowerCase()] ?? null;
}

/**
 * Resolve category image.
 * When storage is integrated, remote imageUrl is used automatically.
 */
export function resolveCategoryImageSource(
  slug: string,
  imageUrl?: string | null,
): ImageSourcePropType {
  if (isRemoteUrl(imageUrl)) return { uri: imageUrl };
  const fromPath = resolveAssetPath(imageUrl);
  if (fromPath) return fromPath;
  return CATEGORY_PLACEHOLDER_MAP[slug] ?? DEFAULT_CATEGORY_PLACEHOLDER;
}

/**
 * Resolve product image from remote URL, /assets path, product slug, or category fallback.
 * Never collapse distinct SKUs onto the first category placeholder (e.g. Polyfix).
 */
export function resolveProductImageSource(opts: {
  imageUrl?: string | null;
  productSlug?: string | null;
  categorySlug?: string | null;
  fallbackImage?: ImageSourcePropType;
}): ImageSourcePropType {
  if (isRemoteUrl(opts.imageUrl)) return { uri: opts.imageUrl };
  const fromPath = resolveAssetPath(opts.imageUrl);
  if (fromPath) return fromPath;
  const fromSlug = resolveByProductSlug(opts.productSlug);
  if (fromSlug) return fromSlug;
  if (opts.fallbackImage) return opts.fallbackImage;
  const slug = opts.categorySlug ?? 'default';
  return PRODUCT_BY_CATEGORY_PLACEHOLDER[slug] ?? DEFAULT_PRODUCT_PLACEHOLDER;
}

export function resolveProductCarouselSources(opts: {
  urls?: string[];
  imageUrl?: string | null;
  productSlug?: string | null;
  categorySlug?: string | null;
}): ImageSourcePropType[] {
  const sources: ImageSourcePropType[] = [];
  for (const url of opts.urls ?? []) {
    if (isRemoteUrl(url)) sources.push({ uri: url });
    else {
      const local = resolveAssetPath(url);
      if (local) sources.push(local);
    }
  }
  if (sources.length > 0) return sources;

  return [
    resolveProductImageSource({
      imageUrl: opts.imageUrl,
      productSlug: opts.productSlug,
      categorySlug: opts.categorySlug,
    }),
  ];
}

export {
  CATEGORY_PLACEHOLDER_MAP,
  PRODUCT_BY_CATEGORY_PLACEHOLDER as PRODUCT_PLACEHOLDER_MAP,
  ASSET_PATH_MAP,
  PRODUCT_SLUG_MAP,
};
