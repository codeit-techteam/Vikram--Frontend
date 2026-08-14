/**
 * Delivery vehicle display helpers.
 * Vehicle selection + ETA come from backend `/delivery/eta` — never invent static ETAs.
 */

export type DeliveryVehicleType =
  | 'BIKE'
  | 'E_LOADER'
  | 'THREE_WHEELER_LOADER'
  | 'PICK_UP_VAN'
  | 'FULL_TRUCK'
  | 'RMC_TRANSIT_MIXER';

export interface VehicleTier {
  type: DeliveryVehicleType;
  label: string;
  shortLabel: string;
  emoji: string;
  /** Ionicons name for UI */
  icon: 'bicycle-outline' | 'car-outline' | 'bus-outline' | 'trail-sign-outline';
}

export const DELIVERY_VEHICLE_DISPLAY_NAMES: Record<DeliveryVehicleType, string> = {
  BIKE: 'Bike',
  E_LOADER: 'E-Loader',
  THREE_WHEELER_LOADER: '3 Wheeler Loader',
  PICK_UP_VAN: 'Pick Up Van',
  FULL_TRUCK: 'Full Truck',
  RMC_TRANSIT_MIXER: 'RMC Transit Mixer',
};

const VEHICLE_UI: Record<DeliveryVehicleType, Omit<VehicleTier, 'type'>> = {
  BIKE: {
    label: 'Bike Delivery',
    shortLabel: 'Bike',
    emoji: '🚲',
    icon: 'bicycle-outline',
  },
  E_LOADER: {
    label: 'E-Loader Delivery',
    shortLabel: 'E-Loader',
    emoji: '🛵',
    icon: 'car-outline',
  },
  THREE_WHEELER_LOADER: {
    label: '3 Wheeler Loader',
    shortLabel: '3 Wheeler',
    emoji: '🛺',
    icon: 'car-outline',
  },
  PICK_UP_VAN: {
    label: 'Pickup Delivery',
    shortLabel: 'Pickup',
    emoji: '🚚',
    icon: 'bus-outline',
  },
  FULL_TRUCK: {
    label: 'Heavy Vehicle Delivery',
    shortLabel: 'Heavy Vehicle',
    emoji: '🚛',
    icon: 'trail-sign-outline',
  },
  RMC_TRANSIT_MIXER: {
    label: 'RMC Mixer Delivery',
    shortLabel: 'Mixer Truck',
    emoji: '🚚',
    icon: 'bus-outline',
  },
};

const HEAVY_CATEGORIES = new Set([
  'aggregates',
  'aggregate',
  'stone',
  'stone-chips',
  'sand',
  'bricks',
  'brick',
  'rmc',
  'steel',
]);

const LIGHT_CATEGORIES = new Set([
  'putty',
  'adhesives',
  'waterproofing',
  'wall-repair',
  'quick-repair',
]);

/** Category → default unit weight (kg) for UI load estimate only. */
export const CATEGORY_WEIGHT_KG: Record<string, number> = {
  cement: 50,
  rmc: 2400,
  steel: 1,
  sand: 45,
  bricks: 2.5,
  aggregates: 42,
  stone: 42,
  'stone-chips': 42,
  putty: 20,
  adhesives: 5,
  'wall-repair': 5,
  waterproofing: 5,
  'quick-repair': 1,
};

export function getVehicleTier(
  type: DeliveryVehicleType | string | null | undefined,
): VehicleTier {
  const key = type as DeliveryVehicleType;
  const ui = VEHICLE_UI[key];
  if (ui) return { type: key, ...ui };
  return { type: 'PICK_UP_VAN', ...VEHICLE_UI.PICK_UP_VAN };
}

function isMassUnit(unit: string | null | undefined): boolean {
  return /^(mt|ton|tonne|tons|tonnes)$/i.test((unit ?? '').trim());
}

function isCubicMeterUnit(unit: string | null | undefined): boolean {
  return /^(cum|cu\.?m|m3|m³|cubic\s+met(er|re)s?)$/i.test((unit ?? '').trim());
}

export function resolvePlaceholderVehicle(
  categoryType: string | null | undefined,
  productName?: string | null,
): VehicleTier {
  const cat = (categoryType || '').toLowerCase();
  const name = (productName || '').toLowerCase();
  if (cat === 'rmc' || name.includes('rmc') || name.includes('ready mix')) {
    return getVehicleTier('RMC_TRANSIT_MIXER');
  }
  if (
    HEAVY_CATEGORIES.has(cat) ||
    name.includes('aggregate') ||
    name.includes('stone chip') ||
    name.includes('blue metal') ||
    name.includes('sand')
  ) {
    return getVehicleTier('PICK_UP_VAN');
  }
  if (cat === 'cement' || name.includes('cement')) {
    return getVehicleTier('E_LOADER');
  }
  if (LIGHT_CATEGORIES.has(cat)) {
    return getVehicleTier('BIKE');
  }
  return getVehicleTier('PICK_UP_VAN');
}

/**
 * @deprecated Local qty→vehicle tiers are not authoritative.
 * Use backend `/delivery/eta`. Kept only as last-resort offline fallback
 * and never used for heavy construction materials.
 */
export function resolveVehicleForQuantity(quantity: number): VehicleTier {
  const qty = Math.max(1, Math.floor(quantity) || 1);
  if (qty <= 10) return getVehicleTier('E_LOADER');
  if (qty <= 25) return getVehicleTier('E_LOADER');
  if (qty <= 50) return getVehicleTier('THREE_WHEELER_LOADER');
  if (qty <= 150) return getVehicleTier('PICK_UP_VAN');
  return getVehicleTier('FULL_TRUCK');
}

export function resolveVehicleForCategory(
  categoryType: string | null | undefined,
  quantity: number,
  productName?: string | null,
): VehicleTier {
  const placeholder = resolvePlaceholderVehicle(categoryType, productName);
  if (placeholder.type !== 'BIKE') return placeholder;
  return resolveVehicleForQuantity(quantity);
}

export function formatLoadLabel(weightKg: number | null | undefined): string {
  if (weightKg == null || weightKg <= 0) return '';
  if (weightKg >= 1000) {
    const mt = weightKg / 1000;
    const label = Number.isInteger(mt) ? String(mt) : mt.toFixed(2).replace(/\.?0+$/, '');
    return `${label} MT`;
  }
  const rounded = Math.round(weightKg * 10) / 10;
  return `${rounded} kg`;
}

export function resolveDisplayWeightKg(input: {
  weightPerUnit?: number | null;
  categoryType?: string | null;
  unit?: string | null;
  quantity: number;
}): number {
  const qty = Math.max(0, input.quantity);
  if (typeof input.weightPerUnit === 'number' && input.weightPerUnit > 0) {
    if (isMassUnit(input.unit) && input.weightPerUnit < 250) {
      return qty * 1000;
    }
    return Math.round(input.weightPerUnit * qty * 100) / 100;
  }
  if (isMassUnit(input.unit)) return qty * 1000;
  if (isCubicMeterUnit(input.unit)) return qty * 2400;
  const fromCategory = CATEGORY_WEIGHT_KG[(input.categoryType || '').toLowerCase()];
  if (fromCategory != null) return Math.round(fromCategory * qty * 100) / 100;
  return 0;
}
