import type { Product } from '@/types/catalog';

export type FilterKey =
  | 'grade'
  | 'eta'
  | 'brand'
  | 'priceRange'
  | 'availability'
  | 'discount'
  | 'bulkPricing'
  | 'sort';

export type QuickFilterKey = 'grade' | 'eta' | 'brand' | 'priceRange' | 'availability';

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

export interface CategoryFilterConfig {
  grades: string[];
  brands: BrandOption[];
  priceBounds: [number, number];
  etaOptions: string[];
  availabilityOptions: string[];
  visibleChips: QuickFilterKey[];
  advancedSections: FilterKey[];
}

export interface ActiveFilters {
  search: string;
  grade: string[];
  eta: string | null;
  brand: string[];
  priceRange: [number, number];
  availability: string[];
  discount: number | null;
  bulkPricing: boolean | null;
  sort: SortOption;
}

export type FilterSectionProps = {
  draft: ActiveFilters;
  onChange: (draft: ActiveFilters) => void;
  config: CategoryFilterConfig;
  products: Product[];
};
