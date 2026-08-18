import {
  resolvePlaceholderVehicle,
  resolveDisplayWeightKg,
  type VehicleTier,
  type DeliveryVehicleType,
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
  vehicleType: DeliveryVehicleType;
  deliveryMode: string;
  /** Placeholder until backend `/delivery/eta` responds — never a static "23 mins". */
  eta: string;
  modeTitle: string;
  deliveryMessage: string;
}

export function resolveWeightPerUnitKg(product: Product): number {
  return resolveDisplayWeightKg({
    weightPerUnit: product.weightPerUnit,
    categoryType: product.categoryType,
    unit: product.unit,
    quantity: 1,
  });
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
  const vehicle = resolvePlaceholderVehicle(product.categoryType, product.name);
  const modeTitle = vehicle.label;

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
    eta: '',
    modeTitle,
    deliveryMessage: '',
  };
}

export function formatUnitCount(quantity: number, unit?: string | null): string {
  const u = typeof unit === 'string' ? unit.trim() : '';
  if (!u) return String(quantity);
  if (/^(cum|cubic\s+metres?|cubic\s+meters?)$/i.test(u)) {
    return quantity === 1 ? '1 Cubic Meter' : `${quantity} Cubic Meters`;
  }
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
