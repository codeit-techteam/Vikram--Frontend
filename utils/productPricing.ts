import type { Product, ProductVariant } from '@/types/catalog';
import { getStartingPrice, productHasStructuredVariants } from '@constants/catalogVariantHelpers';

export interface ProductPricing {
  /** Primary selling price shown to the user (never bulk). */
  sellingPrice: number;
  /** Struck-through original / MRP. */
  originalPrice: number;
  discountPercent: number;
  unit: string;
  hasBulk: boolean;
  bulkThreshold: number;
  bulkPrice: number;
  bulkLabel: string;
}

export function getDiscountPercent(original: number, selling: number): number {
  if (original <= selling || original <= 0) return 0;
  return Math.round(((original - selling) / original) * 100);
}

/** Single source of truth for card + detail pricing display. */
export function getProductPricing(
  product: Product,
  variant?: ProductVariant | null,
): ProductPricing {
  const hasVariants = productHasStructuredVariants(product);
  const sellingPrice = variant
    ? variant.price
    : hasVariants
      ? getStartingPrice(product)
      : product.retailPriceValue;

  const originalPrice =
    sellingPrice > 0 ? Math.round(sellingPrice * 1.06) : sellingPrice;
  const discountPercent = getDiscountPercent(originalPrice, sellingPrice);

  const bulkPrice = variant?.bulkPrice ?? product.bulkPriceValue;
  const hasBulk =
    product.bulkThreshold > 0 &&
    bulkPrice > 0 &&
    bulkPrice < sellingPrice;

  return {
    sellingPrice,
    originalPrice,
    discountPercent,
    unit: variant?.displayUnit || product.unit,
    hasBulk,
    bulkThreshold: product.bulkThreshold,
    bulkPrice: hasBulk ? bulkPrice : 0,
    bulkLabel: product.bulkLabel || `Buy ${product.bulkThreshold}+`,
  };
}

export function getStockLeft(product: Product): number | null {
  if (product.status === 'LIMITED STOCK') return 8;
  if (product.status === 'READY FOR DISPATCH') return 24;
  if (product.status === 'IN STOCK') return 48;
  return null;
}

export function getDeliveryEta(product: Product): string {
  if (product.badge?.includes('90')) return '30–90 mins';
  if (product.badge?.toLowerCase().includes('bulk')) return 'Same day';
  if (product.badge?.toLowerCase().includes('same')) return 'Same day';
  return '2–4 hrs';
}

export function getOfferLabel(product: Product): string | null {
  if (product.badge?.includes('⚡')) return product.badge.replace('⚡', '').trim();
  if (product.badge) return product.badge;
  return null;
}
