import type { Product } from '@/types/catalog';
import type {
  ActiveFilters,
  BrandOption,
  CategoryFilterConfig,
  FilterChip,
  FilterKey,
} from '@/types/filter.types';

export const FILTER_CHIPS: FilterChip[] = [
  { key: 'grade', label: 'Grade', icon: 'layers-outline' },
  { key: 'eta', label: 'ETA', icon: 'time-outline' },
  { key: 'brand', label: 'Brand', icon: 'business-outline' },
  { key: 'priceRange', label: 'Price', icon: 'pricetag-outline' },
  { key: 'availability', label: 'Availability', icon: 'checkmark-circle-outline' },
];

export const ETA_OPTIONS = ['Same Day', '90 min', 'Next Day', '2-3 Days'] as const;

export const AVAILABILITY_OPTIONS = ['In Stock', 'Ready for Dispatch'] as const;

export const PRICE_PRESETS: { label: string; range: [number, number] }[] = [
  { label: 'Under ₹1,000', range: [0, 1000] },
  { label: '₹1,000-₹2,000', range: [1000, 2000] },
  { label: '₹2,000-₹3,000', range: [2000, 3000] },
  { label: '₹3,000+', range: [3000, 100000] },
];

const GRADES_BY_CATEGORY: Record<string, string[]> = {
  '1': ['OPC 43', 'OPC 53', 'PPC'],
  '2': ['Fe500', 'Fe550', 'Fe600'],
  '3': ['Zone 1', 'Zone 2', 'Fine'],
  '4': ['Class A', 'Class B', 'Grade 2'],
  '5': ['G1', 'G2', 'G3', 'Premium'],
  '6': ['Grade A', 'Grade B', 'Grade C'],
};

const BRANDS_BY_CATEGORY: Record<string, BrandOption[]> = {
  '1': [
    { id: 'ultratech', name: 'UltraTech', count: 1, logoText: 'UT' },
    { id: 'acc', name: 'ACC', count: 1, logoText: 'ACC' },
    { id: 'ambuja', name: 'Ambuja', count: 0, logoText: 'AB' },
  ],
  '2': [
    { id: 'tata', name: 'TATA', count: 1, logoText: 'TT' },
    { id: 'jsw', name: 'JSW', count: 1, logoText: 'JSW' },
    { id: 'jindal', name: 'Jindal', count: 0, logoText: 'J' },
  ],
  '3': [
    { id: 'regional', name: 'Regional Supplier', count: 2, logoText: 'RS' },
  ],
  '4': [
    { id: 'regional', name: 'Regional Supplier', count: 2, logoText: 'RS' },
  ],
  '5': [
    { id: 'local', name: 'Local Supplier', count: 1, logoText: 'LS' },
    { id: 'premium', name: 'Premium Sands', count: 0, logoText: 'PS' },
  ],
  '6': [
    { id: 'regional', name: 'Regional Aggregates', count: 2, logoText: 'RA' },
    { id: 'premium', name: 'Premium Stone', count: 0, logoText: 'PS' },
  ],
};

export function extractEtaFromBadge(badge: string): string | null {
  if (badge.includes('90 min')) return '90 min';
  if (badge.includes('Same Day')) return 'Same Day';
  if (badge.includes('Next Day')) return 'Next Day';
  if (badge.includes('2-3')) return '2-3 Days';
  return null;
}

export function extractBrandFromProduct(product: Product, categoryId: string): string {
  const name = product.name;
  const knownBrands = ['UltraTech', 'ACC', 'TATA', 'JSW', 'Ambuja', 'Jindal'];
  for (const brand of knownBrands) {
    if (name.includes(brand)) return brand;
  }

  if (categoryId === '5') return 'Local Supplier';
  if (categoryId === '6') return 'Regional Aggregates';
  if (categoryId === '3' || categoryId === '4') return 'Regional Supplier';

  return 'Other';
}

export function normalizeGrade(productGrade: string, categoryId: string): string {
  const grades = GRADES_BY_CATEGORY[categoryId] ?? [];
  const direct = grades.find(
    (g) => g.toLowerCase() === productGrade.toLowerCase() || productGrade.includes(g),
  );
  if (direct) return direct;

  if (categoryId === '1') {
    if (productGrade === '53') return 'OPC 53';
    if (productGrade === '43') return 'OPC 43';
    return 'PPC';
  }

  return productGrade;
}

export function statusToAvailability(status: Product['status']): string {
  if (status === 'READY FOR DISPATCH') return 'Ready for Dispatch';
  return 'In Stock';
}

export function computePriceBounds(products: Product[]): [number, number] {
  if (products.length === 0) return [0, 5000];
  const prices = products.map((p) => p.retailPriceValue);
  const min = Math.floor(Math.min(...prices) / 100) * 100;
  const max = Math.ceil(Math.max(...prices) / 100) * 100;
  return [Math.max(0, min - 200), max + 500];
}

export function getBrandsWithCounts(
  products: Product[],
  categoryId: string,
  fallbackBrands: BrandOption[],
): BrandOption[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const brand = extractBrandFromProduct(product, categoryId);
    counts.set(brand, (counts.get(brand) ?? 0) + 1);
  }

  const result: BrandOption[] = [];
  for (const [name, count] of counts) {
    const fallback = fallbackBrands.find((b) => b.name === name);
    result.push({
      id: fallback?.id ?? name.toLowerCase().replace(/\s+/g, '-'),
      name,
      count,
      logoText: fallback?.logoText ?? name.slice(0, 2).toUpperCase(),
    });
  }

  for (const brand of fallbackBrands) {
    if (!result.some((b) => b.name === brand.name)) {
      result.push({ ...brand, count: 0 });
    }
  }

  return result.sort((a, b) => b.count - a.count);
}

export function getCategoryFilterConfig(
  categoryId: string,
  products: Product[],
): CategoryFilterConfig {
  const priceBounds = computePriceBounds(products);
  const fallbackBrands = BRANDS_BY_CATEGORY[categoryId] ?? [];

  return {
    grades: GRADES_BY_CATEGORY[categoryId] ?? ['Standard'],
    brands: getBrandsWithCounts(products, categoryId, fallbackBrands),
    priceBounds,
    etaOptions: [...ETA_OPTIONS],
  };
}

export function formatPriceRangeLabel(min: number, max: number, bounds: [number, number]): string {
  const formatK = (n: number) => {
    if (n >= 1000) return `₹${Math.round(n / 100) / 10}K`.replace('.0K', 'K');
    return `₹${n.toLocaleString('en-IN')}`;
  };

  const isDefault = min <= bounds[0] && max >= bounds[1];
  if (isDefault) return 'Price';

  if (min <= bounds[0] && max < bounds[1]) {
    return `Under ${formatK(max)}`;
  }
  if (min > bounds[0] && max >= bounds[1]) {
    return `${formatK(min)}+`;
  }
  return `${formatK(min)} – ${formatK(max)}`;
}

export function getChipLabel(
  key: FilterKey,
  activeFilters: ActiveFilters,
  config: CategoryFilterConfig,
): string {
  switch (key) {
    case 'grade': {
      const selected = activeFilters.grade;
      if (selected.length === 0) return 'Grade';
      if (selected.length <= 2) return selected.join(', ');
      return `Grade (${selected.length})`;
    }
    case 'eta':
      return activeFilters.eta ? `${activeFilters.eta} ETA` : 'ETA';
    case 'brand':
      return activeFilters.brand ?? 'Brand';
    case 'priceRange':
      return formatPriceRangeLabel(
        activeFilters.priceRange[0],
        activeFilters.priceRange[1],
        config.priceBounds,
      );
    case 'availability': {
      const selected = activeFilters.availability;
      if (selected.length === 0) return 'Availability';
      if (selected.length === 1) return selected[0];
      return `Avail (${selected.length})`;
    }
    default:
      return key;
  }
}

export function createDefaultFilters(bounds: [number, number]): ActiveFilters {
  return {
    grade: [],
    eta: null,
    brand: null,
    priceRange: bounds,
    availability: [],
  };
}

export function countActiveFilters(filters: ActiveFilters, bounds: [number, number]): number {
  let count = 0;
  count += filters.grade.length;
  if (filters.eta) count += 1;
  if (filters.brand) count += 1;
  if (filters.priceRange[0] > bounds[0] || filters.priceRange[1] < bounds[1]) count += 1;
  count += filters.availability.length;
  return count;
}

export function isPriceRangeActive(filters: ActiveFilters, bounds: [number, number]): boolean {
  return filters.priceRange[0] > bounds[0] || filters.priceRange[1] < bounds[1];
}
