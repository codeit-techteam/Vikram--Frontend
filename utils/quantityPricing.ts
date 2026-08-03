import {
  CATEGORY_WEIGHT_KG,
  DEFAULT_WEIGHT_PER_UNIT_KG,
  resolveVehicleForQuantity,
  type VehicleTier,
  type VehicleType,
} from '@constants/deliveryVehicles';
import type { Product, ProductVariant } from '@/types/catalog';
import { getProductPricing, type ProductPricing } from '@utils/productPricing';

export interface QuantityPriceBreakdown {
  basePrice: number;
  quantity: number;
  unit: string;
  /** Price actually charged per unit after bulk rules */
  appliedUnitPrice: number;
  /** Retail (non-bulk) unit price */
  retailUnitPrice: number;
  /** MRP / original if higher than retail */
  originalUnitPrice: number;
  /** Line discount vs MRP (not bulk) */
  retailDiscountAmount: number;
  /** Extra savings from bulk tier */
  bulkDiscountAmount: number;
  bulkApplied: boolean;
  bulkThreshold: number;
  bulkPrice: number;
  savePerUnit: number;
  /** Qty still needed to unlock bulk (0 when unlocked / no bulk) */
  bagsToBulk: number;
  progressRatio: number;
  subtotalBeforeGst: number;
  gstRate: number;
  gstAmount: number;
  estimatedTotal: number;
  weightPerUnitKg: number;
  estimatedWeightKg: number;
  vehicle: VehicleTier;
  vehicleType: VehicleType;
  deliveryMode: string;
  eta: string;
  modeTitle: string;
  deliveryMessage: string;
}

export function resolveWeightPerUnitKg(product: Product): number {
  if (typeof product.weightPerUnit === 'number' && product.weightPerUnit > 0) {
    return product.weightPerUnit;
  }
  const fromCategory = CATEGORY_WEIGHT_KG[product.categoryType];
  if (fromCategory != null) return fromCategory;
  return DEFAULT_WEIGHT_PER_UNIT_KG;
}

/**
 * Live pricing + logistics for a selected quantity.
 * Bulk switches automatically at bulkThreshold — never forces a minimum qty.
 */
export function computeQuantityPricing(
  product: Product,
  quantity: number,
  variant?: ProductVariant | null,
  pricingOverride?: ProductPricing | null,
): QuantityPriceBreakdown {
  const pricing = pricingOverride ?? getProductPricing(product, variant);
  const qty = Math.max(1, Math.floor(quantity) || 1);
  const retailUnitPrice = pricing.sellingPrice;
  const bulkThreshold = pricing.hasBulk ? pricing.bulkThreshold : 0;
  const bulkPrice = pricing.hasBulk ? pricing.bulkPrice : 0;
  const bulkApplied =
    pricing.hasBulk && bulkThreshold > 0 && qty >= bulkThreshold && bulkPrice > 0;

  const appliedUnitPrice = bulkApplied ? bulkPrice : retailUnitPrice;
  const savePerUnit = bulkApplied
    ? Math.max(0, retailUnitPrice - bulkPrice)
    : Math.max(0, retailUnitPrice - (bulkPrice || retailUnitPrice));

  const originalUnitPrice =
    pricing.originalPrice > retailUnitPrice ? pricing.originalPrice : retailUnitPrice;

  const lineAtRetail = retailUnitPrice * qty;
  const lineAtApplied = appliedUnitPrice * qty;
  const lineAtMrp = originalUnitPrice * qty;

  const retailDiscountAmount = Math.max(0, lineAtMrp - lineAtRetail);
  const bulkDiscountAmount = bulkApplied ? Math.max(0, lineAtRetail - lineAtApplied) : 0;

  const bagsToBulk =
    pricing.hasBulk && bulkThreshold > qty ? bulkThreshold - qty : 0;
  const progressRatio = pricing.hasBulk && bulkThreshold > 0
    ? Math.min(1, qty / bulkThreshold)
    : 0;

  const gstRate = (product.gst ?? 18) / 100;
  const subtotalBeforeGst = lineAtApplied;
  const gstAmount = Math.round(subtotalBeforeGst * gstRate * 100) / 100;
  const estimatedTotal = Math.round((subtotalBeforeGst + gstAmount) * 100) / 100;

  const weightPerUnitKg = resolveWeightPerUnitKg(product);
  const estimatedWeightKg = Math.round(weightPerUnitKg * qty * 100) / 100;
  const vehicle = resolveVehicleForQuantity(qty);

  return {
    basePrice: retailUnitPrice,
    quantity: qty,
    unit: pricing.unit,
    appliedUnitPrice,
    retailUnitPrice,
    originalUnitPrice,
    retailDiscountAmount,
    bulkDiscountAmount,
    bulkApplied,
    bulkThreshold,
    bulkPrice,
    savePerUnit: pricing.hasBulk ? Math.max(0, retailUnitPrice - bulkPrice) : 0,
    bagsToBulk,
    progressRatio,
    subtotalBeforeGst,
    gstRate: product.gst ?? 18,
    gstAmount,
    estimatedTotal,
    weightPerUnitKg,
    estimatedWeightKg,
    vehicle,
    vehicleType: vehicle.type,
    deliveryMode: vehicle.label,
    eta: vehicle.etaLabel,
    modeTitle: vehicle.modeTitle,
    deliveryMessage: vehicle.message,
  };
}

export function formatUnitCount(quantity: number, unit: string): string {
  const u = unit.trim();
  if (quantity === 1) {
    if (/s$/i.test(u) && !/glass|pieces?/i.test(u)) {
      return `1 ${u.replace(/s$/i, '')}`;
    }
    return `1 ${u}`;
  }
  if (/bag$/i.test(u)) return `${quantity} Bags`;
  if (/piece$/i.test(u)) return `${quantity} Pieces`;
  return `${quantity} ${u}`;
}
