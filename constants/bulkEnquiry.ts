import type { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

export interface MaterialCategory {
  id: string;
  label: string;
  icon: IconName;
  units: string[];
}

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  { id: 'cement', label: 'Cement', icon: 'cube-outline', units: ['Bags'] },
  { id: 'sand', label: 'Sand', icon: 'water-outline', units: ['CFT'] },
  { id: 'bricks', label: 'Bricks', icon: 'grid-outline', units: ['Pieces'] },
  { id: 'aggregates', label: 'Aggregates', icon: 'ellipse-outline', units: ['Tons', 'CFT'] },
  { id: 'adhesives', label: 'Adhesives', icon: 'color-fill-outline', units: ['L', 'ml'] },
  { id: 'putty', label: 'Wall Putty', icon: 'brush-outline', units: ['Kg'] },
  { id: 'waterproofing', label: 'Waterproofing', icon: 'umbrella-outline', units: ['L', 'Kg'] },
  { id: 'quick-repair', label: 'Quick Repair', icon: 'construct-outline', units: ['Units', 'Kg'] },
  { id: 'mixed', label: 'Mixed Load', icon: 'layers-outline', units: ['Bags', 'CFT', 'Pieces', 'Tons', 'Kg', 'L'] },
];

export const DELIVERY_REQUIREMENTS = [
  'Immediate',
  'Today',
  'Tomorrow',
  'Within 3 Days',
  'Within 1 Week',
  'Flexible',
] as const;

export function getUnitsForCategories(categoryIds: string[]): string[] {
  if (categoryIds.length === 0) return [];

  const units = new Set<string>();
  for (const id of categoryIds) {
    const category = MATERIAL_CATEGORIES.find((c) => c.id === id);
    category?.units.forEach((unit) => units.add(unit));
  }
  return Array.from(units);
}

export function getDefaultUnit(categoryIds: string[]): string | null {
  const units = getUnitsForCategories(categoryIds);
  if (units.length === 1) return units[0];
  return null;
}

export function getCategoryLabels(categoryIds: string[]): string[] {
  return categoryIds
    .map((id) => MATERIAL_CATEGORIES.find((c) => c.id === id)?.label)
    .filter((label): label is string => Boolean(label));
}
