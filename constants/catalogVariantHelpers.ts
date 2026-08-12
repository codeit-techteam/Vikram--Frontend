import type { Product, ProductVariant } from '@/types/catalog';

export const CONTACT_FOR_SIZE = 'Contact for Size';
export const VARIANT_COMING_SOON = 'Variant Coming Soon';

export const CFT_VARIANTS = [10, 20, 30, 40, 50, 60, 70, 80, 90].map(
  (size) => `${size} CFT`,
);

export const PIECE_VARIANTS = [100, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 6000].map(
  (count) => `${count.toLocaleString('en-IN')} Pieces`,
);

export const BAG_VARIANTS = Array.from({ length: 100 }, (_, index) => {
  const count = index + 1;
  return `${count} ${count === 1 ? 'Bag' : 'Bags'}`;
});

export const ML_L_VARIANTS = ['250 ml', '500 ml', '1 L', '4 L'];

export const JIVANTOR_VARIANTS = ['250 ml', '500 ml', '1 L', '4 L', '10 L', '20 L'];

export const BUCKET_VARIANTS_STANDARD = ['5 Kg Bucket', '10 Kg Bucket', '20 Kg Bucket'];

export const SAKARNI_POP_VARIANTS = ['5 Kg Bag', '10 Kg Bag', '20 Kg Bag', '50 Kg Bag'];

/** @deprecated Use BUCKET_VARIANTS_STANDARD */
export const KG_VARIANTS_STANDARD = BUCKET_VARIANTS_STANDARD;

export const L_VARIANTS = ['10 L', '20 L'];

export function formatVariantsSummary(variants: string[], maxVisible = 4): string {
  if (variants.length <= maxVisible) return variants.join(' · ');
  return `${variants.slice(0, maxVisible).join(' · ')} · +${variants.length - maxVisible} more`;
}

function mlVariant(
  id: string,
  label: string,
  sizeMl: number,
  price: number,
): ProductVariant {
  const sizeUnit = label.includes('L') && !label.includes('ml') ? 'L' : 'ml';
  return {
    id,
    label,
    size: sizeMl,
    sizeUnit,
    price,
    bulkPrice: null,
    inStock: true,
  };
}

/** Fevicol Marine / SH / HeatX / SpeedX — 250ml, 500ml, 1L, 4L */
export function createFevicolMlVariants(
  prefix: string,
  prices: [number, number, number, number],
): ProductVariant[] {
  return [
    mlVariant(`${prefix}-v1`, '250 ml', 250, prices[0]),
    mlVariant(`${prefix}-v2`, '500 ml', 500, prices[1]),
    mlVariant(`${prefix}-v3`, '1 L', 1000, prices[2]),
    mlVariant(`${prefix}-v4`, '4 L', 4000, prices[3]),
  ];
}

export const FEVICOL_MARINE_VARIANTS = createFevicolMlVariants('marine', [180, 320, 580, 1950]);
export const FEVICOL_SH_VARIANTS = createFevicolMlVariants('sh', [165, 300, 540, 1820]);
export const FEVICOL_HEATX_VARIANTS = createFevicolMlVariants('heatx', [195, 355, 640, 2150]);
export const FEVICOL_SPEEDX_VARIANTS = createFevicolMlVariants('speedx', [210, 380, 685, 2300]);

export const JIVANTOR_PRODUCT_VARIANTS: ProductVariant[] = [
  mlVariant('jiv-v1', '250 ml', 250, 175),
  mlVariant('jiv-v2', '500 ml', 500, 320),
  mlVariant('jiv-v3', '1 L', 1000, 580),
  mlVariant('jiv-v4', '4 L', 4000, 1950),
  mlVariant('jiv-v5', '10 L', 10000, 4500),
  mlVariant('jiv-v6', '20 L', 20000, 8500),
];

function brickVariant(
  id: string,
  count: number,
  price: number,
  bulkPrice: number,
): ProductVariant {
  return {
    id,
    label: `${count.toLocaleString('en-IN')} Pieces`,
    count,
    price,
    bulkPrice,
    inStock: true,
  };
}

export const BRICK_PACK_VARIANTS: ProductVariant[] = [
  brickVariant('b1', 100, 850, 800),
  brickVariant('b2', 200, 1680, 1560),
  brickVariant('b3', 300, 2490, 2310),
  brickVariant('b4', 400, 3280, 3040),
  brickVariant('b5', 500, 4075, 3750),
  brickVariant('b6', 1000, 7800, 7200),
  brickVariant('b7', 2000, 15200, 14000),
  brickVariant('b8', 3000, 22500, 20700),
  brickVariant('b9', 4000, 29600, 27200),
  brickVariant('b10', 5000, 36250, 33000),
  brickVariant('b11', 6000, 43200, 39000),
];

function packVariant(
  id: string,
  label: string,
  displayUnit: string,
  size: number,
  price: number,
): ProductVariant {
  return {
    id,
    label,
    displayUnit,
    size,
    sizeUnit: displayUnit,
    price,
    bulkPrice: null,
    inStock: true,
  };
}

function bucketVariant(id: string, kg: number, pricePerKg: number): ProductVariant {
  const price = Math.round(pricePerKg * kg * (kg >= 5 ? 0.97 : 1));
  return packVariant(id, `${kg} Kg Bucket`, 'Bucket', kg, price);
}

export function createKgPackVariants(
  prefix: string,
  pricePerKg: number,
  sizes: number[],
): ProductVariant[] {
  return sizes.map((kg, i) => bucketVariant(`${prefix}-k${i + 1}`, kg, pricePerKg));
}

export function getVariantDisplayUnit(variant: ProductVariant | undefined): string {
  if (!variant) return '';
  return variant.displayUnit ?? variant.label;
}

export function productHasStructuredVariants(product: Product): boolean {
  return Boolean(product.hasVariants && product.productVariants?.length);
}

export function getDefaultVariantId(product: Product): string | undefined {
  return product.defaultVariantId ?? product.productVariants?.[0]?.id;
}

export function getVariantById(
  product: Product,
  variantId: string | undefined,
): ProductVariant | undefined {
  if (!variantId || !product.productVariants) return undefined;
  return product.productVariants.find((v) => v.id === variantId);
}

export function getVariantLabels(product: Product): string[] {
  if (product.productVariants?.length) {
    return product.productVariants.map((v) => v.label);
  }
  return product.variants ?? [];
}

/** Backend min order, or 1 when unset. Never invent 10/20/50 defaults. */
export function getMinOrderQuantity(product: Pick<Product, 'minOrder'>): number {
  const min = product.minOrder;
  if (typeof min === 'number' && Number.isFinite(min) && min >= 1) {
    return Math.floor(min);
  }
  return 1;
}

/**
 * Initial quantity in sheets / steppers.
 * Always starts at 1 so customers can buy a single unit;
 * bulk pricing unlocks as quantity increases.
 */
export function getDefaultOrderQuantity(_product?: Pick<Product, 'minOrder'>): number {
  return 1;
}

/** Listing cards: stepper only for free-quantity products */
export function usesQuantityStepperOnListing(product: Product): boolean {
  return !productHasStructuredVariants(product);
}

/** Detail screen: always show quantity stepper */
export function usesQuantityStepperOnDetail(_product: Product): boolean {
  return true;
}

/**
 * True when listing can adjust cart qty in-place after the first add
 * (single SKU). Multi-variant products reopen the sheet on +.
 */
export function allowsDirectAddToCart(product: Product): boolean {
  const count = getVariantCount(product);
  if (count > 1) return false;
  if (product.variantsPlaceholder) return false;
  return true;
}

/** Multi-variant products need a picker; used for labels like "N Options". */
export function shouldOpenVariantSheet(product: Product): boolean {
  return getVariantCount(product) > 1;
}

/**
 * Every listing ADD opens the add-to-cart sheet so the customer
 * always chooses quantity (and variant when applicable) first.
 */
export function shouldOpenAddToCartSheet(product: Product): boolean {
  if (product.variantsPlaceholder) return false;
  return true;
}

/** True when the sheet should show variant chips. */
export function sheetShowsVariantPicker(product: Product): boolean {
  return getVariantCount(product) > 1;
}

export function getStartingPrice(product: Product): number {
  if (product.productVariants?.length) {
    return Math.min(...product.productVariants.map((v) => v.price));
  }
  return product.retailPriceValue;
}

export function getStartingVariantLabel(product: Product): string {
  if (!product.productVariants?.length) return product.unit;
  const cheapest = product.productVariants.reduce((min, v) =>
    v.price < min.price ? v : min,
  );
  return getVariantDisplayUnit(cheapest) || cheapest.label;
}

export function getVariantCount(product: Product): number {
  return product.productVariants?.length ?? 0;
}

export function getVariantAvailabilityText(product: Product): string | null {
  const count = getVariantCount(product);
  if (count <= 1) return null;
  if (product.categoryType === 'bricks') {
    return `Available in ${count} Pack Sizes`;
  }
  return `${count} Variants Available`;
}

/** SKU-level unit label (Pieces, CFT, Bags, Bucket, L, Cubic Meter, etc.) */
export function getProductSkuUnit(product: Product): string {
  switch (product.categoryType) {
    case 'adhesives':
      return 'L';
    case 'bricks':
      return 'Pieces';
    case 'sand':
    case 'aggregates':
      return 'CFT';
    case 'rmc':
      return 'Cubic Meter';
    case 'cement':
      return 'Bag';
    case 'wall-repair':
      return product.unit === 'Bag' ? 'Bag' : 'Bucket';
    case 'putty':
      return 'Bucket';
    default:
      if (product.unit === 'ml/L') return 'L';
      return product.unit;
  }
}
