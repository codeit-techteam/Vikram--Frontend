import type { Product } from '@/types/catalog';

export type FilterKey = 'grade' | 'brand' | 'priceRange' | 'discount' | 'bulkPricing' | 'sort';

export type QuickFilterKey = 'grade' | 'brand' | 'priceRange';

export type SortOption =
  | 'popularity'
  | 'recommended'
  | 'price_low'
  | 'price_high'
  | 'discount'
  | 'newest'
  | 'fastest_delivery'
  | 'rating';

export interface FilterChip {
  key: QuickFilterKey;
  label: string;
  icon?: string;
}

export interface BrandOption {
  id: string;
  name: string;
  count: number;
  logoText?: string;
}

export interface PricePresetOption {
  id: string;
  label: string;
  range: [number, number];
}

export interface FacetOption {
  id: string;
  label: string;
  count: number;
}

export interface CategoryFilterConfig {
  grades: string[];
  brands: BrandOption[];
  priceBounds: [number, number];
  pricePresets: PricePresetOption[];
  visibleChips: QuickFilterKey[];
  advancedSections: FilterKey[];
}

export interface ActiveFilters {
  search: string;
  grade: string[];
  brand: string[];
  priceRange: [number, number];
  /** Selected price preset ids — OR logic across ranges */
  pricePresets: string[];
  discount: number | null;
  bulkPricing: boolean | null;
  sort: SortOption;
}

export type FilterSectionProps = {
  draft: ActiveFilters;
  onChange: (draft: ActiveFilters) => void;
  config: CategoryFilterConfig;
  products: Product[];
  /** Dynamic facet counts keyed by option label/id */
  facetCounts?: Record<string, number>;
  /** Live matching product count (Price section) */
  matchingCount?: number;
};
