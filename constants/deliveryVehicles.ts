/**
 * Delivery vehicle types — must match backend DeliveryVehicleType enum.
 * Pricing comes from backend; this file only allocates vehicle by quantity.
 */

export type DeliveryVehicleType =
  | 'BIKE'
  | 'E_LOADER'
  | 'THREE_WHEELER_LOADER'
  | 'PICK_UP_VAN'
  | 'FULL_TRUCK';

export interface VehicleTier {
  type: DeliveryVehicleType;
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

export const DELIVERY_VEHICLE_DISPLAY_NAMES: Record<DeliveryVehicleType, string> = {
  BIKE: 'Bike',
  E_LOADER: 'E-Loader',
  THREE_WHEELER_LOADER: '3 Wheeler Loader',
  PICK_UP_VAN: 'Pick Up Van',
  FULL_TRUCK: 'Full Truck',
};

/** Quantity thresholds — synced with backend DELIVERY_VEHICLE_QTY_TIERS. */
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
    type: 'E_LOADER',
    maxQty: 25,
    label: 'E-Loader Delivery',
    shortLabel: 'E-Loader',
    emoji: '🛵',
    icon: 'car-outline',
    etaLabel: '35 mins',
    modeTitle: 'E-Loader Delivery',
    message: 'ETA 35 mins',
  },
  {
    type: 'THREE_WHEELER_LOADER',
    maxQty: 50,
    label: '3 Wheeler Loader',
    shortLabel: '3 Wheeler',
    emoji: '🛺',
    icon: 'car-outline',
    etaLabel: '45 mins',
    modeTitle: 'Mini Vehicle Delivery',
    message: 'ETA 45 mins',
  },
  {
    type: 'PICK_UP_VAN',
    maxQty: 150,
    label: 'Pick Up Van',
    shortLabel: 'Pick Up Van',
    emoji: '🚚',
    icon: 'bus-outline',
    etaLabel: '2 Hours',
    modeTitle: 'Pick Up Van Delivery',
    message: 'ETA 2 Hours',
  },
  {
    type: 'FULL_TRUCK',
    maxQty: Number.POSITIVE_INFINITY,
    label: 'Full Truck',
    shortLabel: 'Full Truck',
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
  rmc: 1,
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
