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
  cement: ['OPC 43', 'OPC 53', 'PPC'],
  steel: ['Fe500', 'Fe550', 'Fe600'],
  sand: ['Zone 1', 'Zone 2', 'Fine'],
  bricks: ['Class A', 'Class B', 'Grade 2'],
  'grey-fill-sand': ['G1', 'G2', 'G3', 'Premium'],
  'stone-chips': ['Grade A', 'Grade B', 'Grade C'],
  aggregates: ['Standard', 'Fine', 'Coarse'],
  adhesives: ['Standard'],
  'wall-repair': ['Standard'],
  waterproofing: ['Standard'],
  'quick-repair': ['Standard'],
  putty: ['Standard'],
};

const BRANDS_BY_CATEGORY: Record<string, BrandOption[]> = {
  cement: [
    { id: 'ultratech', name: 'UltraTech', count: 1, logoText: 'UT' },
    { id: 'acc', name: 'ACC', count: 0, logoText: 'ACC' },
    { id: 'ambuja', name: 'Ambuja', count: 0, logoText: 'AB' },
  ],
  steel: [
    { id: 'tata', name: 'TATA', count: 1, logoText: 'TT' },
    { id: 'jsw', name: 'JSW', count: 1, logoText: 'JSW' },
    { id: 'jindal', name: 'Jindal', count: 0, logoText: 'J' },
  ],
  sand: [{ id: 'regional', name: 'Regional Supplier', count: 2, logoText: 'RS' }],
  bricks: [{ id: 'regional', name: 'Regional Supplier', count: 2, logoText: 'RS' }],
  'grey-fill-sand': [
    { id: 'local', name: 'Local Supplier', count: 1, logoText: 'LS' },
    { id: 'premium', name: 'Premium Sands', count: 0, logoText: 'PS' },
  ],
  'stone-chips': [
    { id: 'regional', name: 'Regional Aggregates', count: 2, logoText: 'RA' },
    { id: 'premium', name: 'Premium Stone', count: 0, logoText: 'PS' },
  ],
  aggregates: [{ id: 'regional', name: 'Regional Aggregates', count: 1, logoText: 'RA' }],
  adhesives: [
    { id: 'fevicol', name: 'Fevicol', count: 6, logoText: 'FV' },
    { id: 'jivantor', name: 'Jivantor', count: 1, logoText: 'JV' },
  ],
  'wall-repair': [
    { id: 'jk', name: 'JK', count: 1, logoText: 'JK' },
    { id: 'birla', name: 'Birla', count: 1, logoText: 'BR' },
    { id: 'sakarni', name: 'Sakarni', count: 1, logoText: 'SK' },
  ],
  waterproofing: [{ id: 'dr-fixit', name: 'Dr Fixit', count: 6, logoText: 'DF' }],
  'quick-repair': [
    { id: 'polyfix', name: 'Polyfix', count: 1, logoText: 'PF' },
    { id: 'araldite', name: 'Araldite', count: 1, logoText: 'AR' },
    { id: 'fevikwik', name: 'FeviKwik', count: 1, logoText: 'FK' },
  ],
  putty: [{ id: 'asian-paints', name: 'Asian Paints', count: 1, logoText: 'AP' }],
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
  const knownBrands = [
    'UltraTech',
    'ACC',
    'TATA',
    'JSW',
    'Ambuja',
    'Jindal',
    'Fevicol',
    'Jivantor',
    'Dr Fixit',
    'Asian Paints',
    'JK',
    'Birla',
    'Sakarni',
    'Polyfix',
    'Araldite',
    'FeviKwik',
  ];
  for (const brand of knownBrands) {
    if (name.includes(brand)) return brand;
  }

  if (categoryId === 'grey-fill-sand') return 'Local Supplier';
  if (categoryId === 'stone-chips' || categoryId === 'aggregates') return 'Regional Aggregates';
  if (categoryId === 'sand' || categoryId === 'bricks') return 'Regional Supplier';

  return 'Other';
}

export function normalizeGrade(productGrade: string, categoryId: string): string {
  const grades = GRADES_BY_CATEGORY[categoryId] ?? [];
  const direct = grades.find(
    (g) => g.toLowerCase() === productGrade.toLowerCase() || productGrade.includes(g),
  );
  if (direct) return direct;

  if (categoryId === 'cement') {
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
