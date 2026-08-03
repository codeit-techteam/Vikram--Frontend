/**
 * Automatic delivery vehicle allocation by quantity (bag-equivalent units).
 * Thresholds are frontend-configurable until backend config is wired.
 */

export type VehicleType = 'BIKE' | 'THREE_WHEELER' | 'PICKUP' | 'TRUCK';

export interface VehicleTier {
  type: VehicleType;
  /** Inclusive max quantity for this tier (Infinity for last). */
  maxQty: number;
  label: string;
  shortLabel: string;
  emoji: string;
  /** Ionicons name for UI */
  icon: 'bicycle-outline' | 'car-outline' | 'bus-outline' | 'trail-sign-outline';
  /** Default ETA copy when product has no dynamic ETA */
  etaLabel: string;
  /** Delivery mode headline shown under quantity */
  modeTitle: string;
  /** Customer-facing message for this band */
  message: string;
}

/** Quantity thresholds — bike → three-wheeler → pickup → truck. */
export const VEHICLE_TIERS: readonly VehicleTier[] = [
  {
    type: 'BIKE',
    maxQty: 10,
    label: 'Bike Delivery',
    shortLabel: 'Bike',
    emoji: '🚲',
    icon: 'bicycle-outline',
    etaLabel: '23 mins',
    modeTitle: 'Fast Bike Delivery',
    message: 'ETA 23 mins',
  },
  {
    type: 'THREE_WHEELER',
    maxQty: 40,
    label: 'Mini Vehicle Delivery',
    shortLabel: 'Three Wheeler',
    emoji: '🛺',
    icon: 'car-outline',
    etaLabel: '45 mins',
    modeTitle: 'Mini Vehicle Delivery',
    message: 'ETA 45 mins',
  },
  {
    type: 'PICKUP',
    maxQty: 150,
    label: 'Truck Delivery',
    shortLabel: 'Truck',
    emoji: '🚚',
    icon: 'bus-outline',
    etaLabel: '2 Hours',
    modeTitle: 'Heavy Vehicle Delivery',
    message: 'ETA 2 Hours',
  },
  {
    type: 'TRUCK',
    maxQty: Number.POSITIVE_INFINITY,
    label: 'Heavy Vehicle Dispatch',
    shortLabel: 'Truck',
    emoji: '🚛',
    icon: 'trail-sign-outline',
    etaLabel: '2 Hours',
    modeTitle: 'Heavy Vehicle Delivery',
    message: 'ETA 2 Hours',
  },
] as const;

/** Default bag weight (kg) when product has no weightPerUnit — typical cement bag. */
export const DEFAULT_WEIGHT_PER_UNIT_KG = 50;

/** Category → default unit weight (kg) fallbacks. */
export const CATEGORY_WEIGHT_KG: Record<string, number> = {
  cement: 50,
  steel: 1,
  sand: 40,
  bricks: 2.5,
  aggregates: 40,
  putty: 20,
  adhesives: 1,
  'wall-repair': 5,
  waterproofing: 5,
  'quick-repair': 1,
};

export function resolveVehicleForQuantity(quantity: number): VehicleTier {
  const qty = Math.max(1, Math.floor(quantity) || 1);
  for (const tier of VEHICLE_TIERS) {
    if (qty <= tier.maxQty) return tier;
  }
  return VEHICLE_TIERS[VEHICLE_TIERS.length - 1];
}
