import type { Product } from '@/types/catalog';

export type FilterKey = 'grade' | 'eta' | 'brand' | 'priceRange' | 'availability';

export interface FilterChip {
  key: FilterKey;
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
}

export interface ActiveFilters {
  grade: string[];
  eta: string | null;
  brand: string | null;
  priceRange: [number, number];
  availability: string[];
}

export interface FilterStateSnapshot {
  activeFilters: ActiveFilters;
  draftFilters: ActiveFilters;
}

export type FilterSectionProps = {
  draft: ActiveFilters;
  onChange: (draft: ActiveFilters) => void;
  config: CategoryFilterConfig;
  products: Product[];
};
