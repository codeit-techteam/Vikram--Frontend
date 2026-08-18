import type { Ionicons } from '@expo/vector-icons';

import type { BulkDeliveryRequirement } from '@services/bulk.api';

type IconName = keyof typeof Ionicons.glyphMap;

/** Virtual mixed-load category slug (not a catalog row). */
export const MIXED_LOAD_SLUG = 'mixed';

/** UI icon helpers keyed by category slug from API. */
export const CATEGORY_ICON_BY_SLUG: Record<string, IconName> = {
  cement: 'cube-outline',
  hardware: 'construct-outline',
  rmc: 'car-outline',
  steel: 'car-outline',
  sand: 'water-outline',
  bricks: 'grid-outline',
  'grey-fill-sand': 'water-outline',
  greyfillsand: 'water-outline',
  'stone-chips': 'ellipse-outline',
  stonechips: 'ellipse-outline',
  aggregates: 'ellipse-outline',
  adhesives: 'color-fill-outline',
  'wall-repair': 'hammer-outline',
  putty: 'brush-outline',
  'wall-putty': 'brush-outline',
  waterproofing: 'umbrella-outline',
  'quick-repair': 'construct-outline',
  [MIXED_LOAD_SLUG]: 'layers-outline',
};

/** Preferred units per category slug (UI hints; API `units` is fallback). */
export const UNIT_HINTS_BY_SLUG: Record<string, string[]> = {
  cement: ['Bags'],
  hardware: ['Units', 'Pieces', 'Numbers'],
  /** IndiaMART traditional RMC unit; Cum is the short trade alias (same volume). */
  rmc: ['Cubic Meter', 'Cum'],
  steel: ['Cubic Meter', 'Cum'],
  sand: ['Cubic Meter', 'MT', 'Loads'],
  bricks: ['Pieces', 'Numbers'],
  'grey-fill-sand': ['Cubic Meter', 'MT', 'Loads'],
  greyfillsand: ['Cubic Meter', 'MT', 'Loads'],
  'stone-chips': ['MT', 'Tonnes', 'Cubic Meter'],
  stonechips: ['MT', 'Tonnes', 'Cubic Meter'],
  aggregates: ['MT', 'Tonnes', 'Cubic Meter'],
  adhesives: ['Units', 'Litre'],
  'wall-repair': ['Units', 'Bags'],
  putty: ['Bags', 'Units'],
  'wall-putty': ['Bags', 'Units'],
  waterproofing: ['Litre', 'Units'],
  'quick-repair': ['Units', 'Bags'],
  [MIXED_LOAD_SLUG]: [
    'Bags',
    'MT',
    'Tonnes',
    'Cubic Meter',
    'Cum',
    'Pieces',
    'Numbers',
    'Loads',
    'Units',
  ],
};

export const DELIVERY_REQUIREMENT_LABELS: Record<BulkDeliveryRequirement, string> = {
  IMMEDIATE: 'Immediate',
  TODAY: 'Today',
  TOMORROW: 'Tomorrow',
  WITHIN_3_DAYS: 'Within 3 days',
  WITHIN_1_WEEK: 'Within 1 week',
  FLEXIBLE: 'Flexible',
};

const LABEL_TO_DELIVERY_VALUE: Record<string, BulkDeliveryRequirement> = {
  immediate: 'IMMEDIATE',
  today: 'TODAY',
  tomorrow: 'TOMORROW',
  'within 3 days': 'WITHIN_3_DAYS',
  'within 3 days.': 'WITHIN_3_DAYS',
  'within 1 week': 'WITHIN_1_WEEK',
  flexible: 'FLEXIBLE',
};

export function getCategoryIcon(slug?: string | null): IconName {
  if (!slug) return 'cube-outline';
  return CATEGORY_ICON_BY_SLUG[slug.toLowerCase()] ?? 'cube-outline';
}

export function deliveryValueToLabel(
  value?: string | null,
  options?: Array<{ value: string; label: string }>,
): string {
  if (!value) return '';
  const fromApi = options?.find((o) => o.value === value)?.label;
  if (fromApi) return fromApi;
  return (
    DELIVERY_REQUIREMENT_LABELS[value as BulkDeliveryRequirement] ?? value
  );
}

export function deliveryLabelToValue(
  labelOrValue: string,
): BulkDeliveryRequirement | null {
  const trimmed = labelOrValue.trim();
  if (!trimmed) return null;
  if (trimmed in DELIVERY_REQUIREMENT_LABELS) {
    return trimmed as BulkDeliveryRequirement;
  }
  return LABEL_TO_DELIVERY_VALUE[trimmed.toLowerCase()] ?? null;
}

export function getUnitsForSlugs(
  slugs: string[],
  fallbackUnits: string[] = [],
): string[] {
  if (slugs.length === 0) return fallbackUnits;

  const units = new Set<string>();
  for (const slug of slugs) {
    const hints = UNIT_HINTS_BY_SLUG[slug.toLowerCase()];
    if (hints?.length) {
      hints.forEach((u) => units.add(u));
    }
  }

  if (units.size === 0) {
    fallbackUnits.forEach((u) => units.add(u));
  }

  return Array.from(units);
}

export function getDefaultUnit(
  slugs: string[],
  fallbackUnits: string[] = [],
): string | null {
  const units = getUnitsForSlugs(slugs, fallbackUnits);
  return units[0] ?? null;
}

export function getUnitsForSlug(
  slug: string,
  fallbackUnits: string[] = [],
): string[] {
  return getUnitsForSlugs([slug], fallbackUnits);
}

export function isBricksSlug(slug?: string | null): boolean {
  return (slug ?? '').toLowerCase() === 'bricks';
}

export function isRmcSlug(slug?: string | null): boolean {
  const s = (slug ?? '').toLowerCase();
  return s === 'rmc' || s === 'steel';
}

/** Ordered customer-facing timeline steps for enquiry detail. */
export const BULK_STATUS_TIMELINE = [
  'Enquiry Submitted',
  'Executive Assigned',
  'Requirement Reviewed',
  'Quote Prepared',
  'Quote Sent',
  'Negotiation',
  'Order Confirmed',
] as const;

export function timelineIndexForStatus(
  customerFacingStatus?: string | null,
  internalStatus?: string | null,
): number {
  const label = (customerFacingStatus ?? '').trim();
  if (label === 'Closed') return -1;

  const idx = BULK_STATUS_TIMELINE.findIndex(
    (step) => step.toLowerCase() === label.toLowerCase(),
  );
  if (idx >= 0) return idx;

  switch (internalStatus) {
    case 'NEW':
      return 0;
    case 'ASSIGNED':
      return 1;
    case 'CONTACTED':
    case 'IN_PROGRESS':
      return 2;
    case 'QUOTE_PREPARED':
      return 3;
    case 'QUOTE_SENT':
    case 'QUOTED':
      return 4;
    case 'NEGOTIATION':
      return 5;
    case 'CONVERTED':
    case 'ORDER_CREATED':
    case 'COMPLETED':
      return 6;
    default:
      return 0;
  }
}

export function formatMaterialLabel(enquiry: {
  isMixedLoad?: boolean;
  materialCategoryName?: string | null;
  materialCategorySlug?: string | null;
  materialCategories?: Array<{ name: string; slug: string }> | null;
  materialTypeLabel?: string | null;
}): string {
  if (enquiry.isMixedLoad) {
    const names = (enquiry.materialCategories ?? [])
      .map((c) => c.name)
      .filter(Boolean);
    if (names.length) return `Mixed Load (${names.join(', ')})`;
    return 'Mixed Load';
  }
  if (enquiry.materialCategoryName) return enquiry.materialCategoryName;
  if (enquiry.materialTypeLabel) return enquiry.materialTypeLabel;
  if (enquiry.materialCategorySlug) return enquiry.materialCategorySlug;
  return 'Bulk material';
}

export function formatQuantityLabel(enquiry: {
  expectedQuantity?: number | null;
  expectedUnit?: string | null;
  materialCategories?: Array<{
    name: string;
    slug?: string;
    quantity?: number | null;
    unit?: string | null;
  }> | null;
}): string {
  const lines = (enquiry.materialCategories ?? [])
    .filter((c) => c.quantity != null && Number(c.quantity) > 0 && c.unit)
    .map((c) =>
      `${c.quantity} ${c.unit}${c.name ? ` ${c.name}` : ''}`.trim(),
    );
  if (lines.length) return lines.join(', ');
  if (enquiry.expectedQuantity != null && enquiry.expectedUnit) {
    return `${enquiry.expectedQuantity} ${enquiry.expectedUnit}`;
  }
  return '—';
}

export function preferredContactLabel(value?: string | null): string {
  switch (value) {
    case 'CALL':
      return 'Call';
    case 'WHATSAPP':
      return 'WhatsApp';
    case 'BOTH':
      return 'Call or WhatsApp';
    default:
      return value?.trim() || '—';
  }
}
