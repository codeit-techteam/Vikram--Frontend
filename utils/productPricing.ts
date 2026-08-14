import type { Product, ProductVariant } from '@/types/catalog';
import { getStartingPrice, productHasStructuredVariants } from '@constants/catalogVariantHelpers';

export interface ProductPricing {
  /** Primary selling price shown to the user (never bulk). */
  sellingPrice: number;
  /** Struck-through original / MRP from API (no fabricated markup). */
  originalPrice: number;
  discountPercent: number;
  unit: string;
  hasBulk: boolean;
  bulkThreshold: number;
  bulkPrice: number;
  bulkLabel: string;
  bulkTiers: Array<{ minQty: number; price: number; label?: string | null }>;
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

  const mrp = variant?.mrp ?? product.mrp ?? null;
  const originalPrice = mrp && mrp > sellingPrice ? mrp : sellingPrice;
  const discountPercent =
    variant?.discountPercent ??
    product.discountPercent ??
    getDiscountPercent(originalPrice, sellingPrice);

  const bulkTiers =
    product.bulkPricing?.length
      ? product.bulkPricing
      : product.bulkThreshold > 0 && product.bulkPriceValue > 0
        ? [
            {
              minQty: product.bulkThreshold,
              price: product.bulkPriceValue,
              label: product.bulkLabel,
            },
          ]
        : [];

  const variantBulk = variant?.bulkPrice;
  const primaryBulk = variantBulk ?? bulkTiers[0]?.price ?? product.bulkPriceValue;
  const bulkThreshold = bulkTiers[0]?.minQty ?? product.bulkThreshold;
  const hasBulk =
    bulkThreshold > 0 &&
    primaryBulk > 0 &&
    primaryBulk < sellingPrice;

  return {
    sellingPrice,
    originalPrice,
    discountPercent,
    unit: variant?.displayUnit || product.unit,
    hasBulk,
    bulkThreshold,
    bulkPrice: hasBulk ? primaryBulk : 0,
    bulkLabel:
      product.bulkLabel ||
      bulkTiers[0]?.label ||
      (bulkThreshold > 0 ? `Unlock ₹${Math.round(primaryBulk)} Bulk Price` : ''),
    bulkTiers,
  };
}

export function getStockLeft(product: Product): number | null {
  if (product.availableStock != null) return product.availableStock;
  if (product.stockLeft != null) return product.stockLeft;
  if (product.status === 'OUT OF STOCK') return 0;
  return null;
}

/**
 * Prefer the live engine label. Never invent a static "Delivery in 23 mins"
 * from a shared minute count that belongs to another product or an empty cart.
 */
export function getDeliveryEta(
  product: Product,
  _dynamicEtaMinutes?: number | null,
  dynamicEtaLabel?: string | null,
): string {
  if (dynamicEtaLabel && dynamicEtaLabel.trim()) return dynamicEtaLabel;
  if (product.deliveryMessage) return product.deliveryMessage;
  return '';
}

export function getOfferLabel(product: Product): string | null {
  if (product.badge?.includes('⚡')) return product.badge.replace('⚡', '').trim();
  if (product.badge) return product.badge;
  return null;
}

export function getBulkUnlockLabel(pricing: ProductPricing): string | null {
  if (!pricing.hasBulk) return null;
  return (
    pricing.bulkLabel ||
    `Unlock ₹${Math.round(pricing.bulkPrice)} Bulk Price`
  );
}
