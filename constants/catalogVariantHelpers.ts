import type { Product, ProductVariant } from '@/types/catalog';

export const CONTACT_FOR_SIZE = 'Contact for Size';
export const VARIANT_COMING_SOON = 'Variant Coming Soon';

export function formatVariantsSummary(variants: string[], maxVisible = 4): string {
  if (variants.length <= maxVisible) return variants.join(' · ');
  return `${variants.slice(0, maxVisible).join(' · ')} · +${variants.length - maxVisible} more`;
}

export function getVariantDisplayUnit(variant: ProductVariant | undefined): string {
  if (!variant) return '';
  return (
    variant.unit ||
    variant.displayUnit ||
    variant.sizeUnit ||
    variant.label ||
    ''
  );
}

/** Customer-facing chip text: "100 Pack", "50 kg", "Pack". */
export function formatVariantChoiceLabel(variant: ProductVariant): string {
  const unit = (variant.unit || variant.displayUnit || variant.sizeUnit || '').trim();
  const value = (variant.value || '').trim();
  if (value && unit) {
    if (value.toLowerCase() === unit.toLowerCase()) return unit;
    return `${value} ${unit}`;
  }
  if (variant.label?.trim()) return variant.label.trim();
  return unit || value || 'Option';
}

export function productHasStructuredVariants(product: Product): boolean {
  return (product.productVariants?.length ?? 0) > 0;
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
    return product.productVariants.map((v) => formatVariantChoiceLabel(v));
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
  return getVariantCount(product) >= 1;
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
  return `${count} variants available`;
}

export function getVariantChooserLabel(product?: Product): string {
  const attribute =
    product?.variantAttribute?.trim() ||
    product?.productVariants?.[0]?.attribute?.trim();
  if (attribute) return `Choose ${attribute.toLowerCase()}`;

  // Seeded variants predate the attribute column, so fall back to their sizing fields.
  const sized = product?.productVariants?.some(
    (variant) => variant.size != null || variant.sizeUnit,
  );
  return sized ? 'Choose size' : 'Choose pack';
}

/** SKU-level unit label. Prefer the saved catalog / variant unit so Pack/Bag/kg from Admin win. */
export function getProductSkuUnit(product: Product): string {
  const fromVariant = product.productVariants?.length
    ? getVariantDisplayUnit(
        product.productVariants.reduce((min, variant) =>
          variant.price < min.price ? variant : min,
        ),
      )
    : '';
  const saved = (fromVariant || product.unit)?.trim();
  if (saved && saved.toLowerCase() !== 'ml/l') {
    return saved;
  }
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
      return 'Bucket';
    case 'putty':
      return 'Bucket';
    default:
      return saved || 'Bag';
  }
}
