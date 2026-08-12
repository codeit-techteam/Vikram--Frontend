/**
 * Catalog unit display helpers.
 * RMC uses IndiaMART-style traditional volume unit: Cubic Meter (trade short form: Cum).
 */

/** Canonical RMC / ready-mix volume unit (customer-facing). */
export const RMC_UNIT = 'Cubic Meter';

/** Traditional on-site short form — same volume as Cubic Meter. */
export const RMC_UNIT_SHORT = 'Cum';

const CUBIC_METER_ALIASES = new Set([
  'cum',
  'cu.m',
  'cu.m.',
  'cu m',
  'm3',
  'm³',
  'cubic meter',
  'cubic meters',
  'cubic metre',
  'cubic metres',
]);

export function isCubicMeterUnit(unit?: string | null): boolean {
  if (!unit) return false;
  return CUBIC_METER_ALIASES.has(unit.trim().toLowerCase());
}

/** Normalize Cum / Cubic Metres / m³ → Cubic Meter for display + sync. */
export function normalizeUnitLabel(unit?: string | null): string {
  if (!unit?.trim()) return '';
  if (isCubicMeterUnit(unit)) return RMC_UNIT;
  return unit.trim();
}

/** Rewrite bulk labels that still say Cum to Cubic Meter. */
export function normalizeBulkLabel(label?: string | null): string {
  if (!label?.trim()) return '';
  return label
    .replace(/\bCum\b/gi, RMC_UNIT)
    .replace(/\bCubic Metres?\b/gi, RMC_UNIT)
    .trim();
}
