import type { Product } from '@/types/catalog';
import type {
  ActiveFilters,
  BrandOption,
  CategoryFilterConfig,
  FilterChip,
  FilterKey,
  QuickFilterKey,
  SortOption,
} from '@/types/filter.types';

export const FILTER_CHIPS: FilterChip[] = [
  { key: 'grade', label: 'Grade', icon: 'layers-outline' },
  { key: 'eta', label: 'ETA', icon: 'time-outline' },
  { key: 'brand', label: 'Brand', icon: 'business-outline' },
  { key: 'priceRange', label: 'Price', icon: 'pricetag-outline' },
  { key: 'availability', label: 'Availability', icon: 'checkmark-circle-outline' },
];

export const ETA_OPTIONS = [
  'Under 30 mins',
  '30–60 mins',
  'Today',
  'Tomorrow',
] as const;

export const AVAILABILITY_OPTIONS = [
  'In Stock',
  'Limited Stock',
  'Out of Stock',
] as const;

export const DEFAULT_AVAILABILITY: string[] = ['In Stock'];

export const PRICE_PRESETS: { label: string; range: [number, number] }[] = [
  { label: 'Under ₹500', range: [0, 500] },
  { label: '₹500–₹1000', range: [500, 1000] },
  { label: '₹1000–₹5000', range: [1000, 5000] },
  { label: '₹5000+', range: [5000, 100000] },
];

export const DISCOUNT_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Any', value: null },
  { label: '10%+', value: 10 },
  { label: '20%+', value: 20 },
  { label: '30%+', value: 30 },
  { label: '50%+', value: 50 },
];

export const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'popularity', label: 'Popularity' },
  { key: 'price_low', label: 'Price: Low → High' },
  { key: 'price_high', label: 'Price: High → Low' },
  { key: 'discount', label: 'Highest Discount' },
  { key: 'newest', label: 'Newest' },
  { key: 'fastest_delivery', label: 'Fastest Delivery' },
  { key: 'rating', label: 'Customer Rating' },
];

const GRADES_BY_CATEGORY: Record<string, string[]> = {
  cement: ['OPC 43', 'OPC 53', 'PPC', 'OPC43', 'OPC53'],
  steel: ['Fe415', 'Fe500', 'Fe550', 'Fe600'],
  sand: ['Zone 1', 'Zone 2', 'Fine'],
  bricks: ['Class A', 'Class B', 'Grade 2'],
  'grey-fill-sand': ['G1', 'G2', 'G3', 'Premium'],
  'stone-chips': ['Grade A', 'Grade B', 'Grade C'],
  aggregates: ['Standard', 'Fine', 'Coarse'],
};

/** Quick chips per category. Advanced Filter sheet still includes relevant sections. */
const CHIPS_BY_CATEGORY: Record<string, QuickFilterKey[]> = {
  cement: ['brand', 'priceRange', 'availability'],
  steel: ['brand', 'grade', 'priceRange', 'eta'],
  bricks: ['brand', 'priceRange', 'availability'],
  sand: ['brand', 'priceRange', 'availability'],
  'grey-fill-sand': ['brand', 'priceRange', 'availability'],
  'stone-chips': ['brand', 'grade', 'priceRange'],
  aggregates: ['brand', 'grade', 'priceRange'],
  adhesives: ['brand', 'priceRange', 'availability'],
  'wall-repair': ['brand', 'priceRange', 'availability'],
  waterproofing: ['brand', 'priceRange', 'availability'],
  'quick-repair': ['brand', 'priceRange', 'availability'],
  putty: ['brand', 'priceRange', 'availability'],
};

const DEFAULT_CHIPS: QuickFilterKey[] = [
  'brand',
  'priceRange',
  'availability',
];

const KNOWN_BRANDS = [
  'UltraTech',
  'ACC',
  'Ambuja',
  'JK Cement',
  'JK',
  'Dalmia',
  'Birla White',
  'Birla',
  'TATA',
  'JSW',
  'Jindal',
  'Fevicol',
  'Jivantor',
  'Dr Fixit',
  'Asian Paints',
  'Sakarni',
  'Polyfix',
  'Araldite',
  'FeviKwik',
  'Regional',
];

function normalizeCategoryKey(categoryId: string): string {
  return (categoryId || '').toLowerCase().trim();
}

export function getVisibleChips(categoryId: string): QuickFilterKey[] {
  const key = normalizeCategoryKey(categoryId);
  return CHIPS_BY_CATEGORY[key] ?? DEFAULT_CHIPS;
}

export function getAdvancedSections(categoryId: string): FilterKey[] {
  const chips = getVisibleChips(categoryId);
  const sections: FilterKey[] = [];
  const order: FilterKey[] = [
    'brand',
    'priceRange',
    'availability',
    'eta',
    'grade',
    'discount',
    'bulkPricing',
    'sort',
  ];

  for (const key of order) {
    if (key === 'discount' || key === 'bulkPricing' || key === 'sort') {
      sections.push(key);
      continue;
    }
    if (chips.includes(key as QuickFilterKey)) {
      sections.push(key);
      continue;
    }
    // Include grade/eta in advanced when category has meaningful options
    if (key === 'grade') {
      const grades = GRADES_BY_CATEGORY[normalizeCategoryKey(categoryId)];
      if (grades && grades.length > 0 && grades[0] !== 'Standard') {
        sections.push(key);
      }
    }
    if (key === 'eta' && chips.includes('eta')) {
      sections.push(key);
    }
  }

  // Ensure unique while preserving order
  return [...new Set(sections)];
}

export function extractDeliveryMinutes(product: Product): number | null {
  if (
    product.estimatedDeliveryMinutes != null &&
    product.estimatedDeliveryMinutes > 0
  ) {
    return product.estimatedDeliveryMinutes;
  }

  const sources = [product.deliveryMessage, product.deliveryETA, product.badge]
    .filter(Boolean)
    .join(' ');

  const minMatch = sources.match(/(\d+)\s*min/i);
  if (minMatch) return Number(minMatch[1]);

  const hourMatch = sources.match(/(\d+)\s*h(?:our)?s?/i);
  if (hourMatch) return Number(hourMatch[1]) * 60;

  return null;
}

export function extractEtaBucket(product: Product): string | null {
  const minutes = extractDeliveryMinutes(product);
  if (minutes != null) {
    if (minutes <= 30) return 'Under 30 mins';
    if (minutes <= 60) return '30–60 mins';
    if (minutes <= 24 * 60) return 'Today';
    if (minutes <= 48 * 60) return 'Tomorrow';
  }

  const text = [product.deliveryMessage, product.deliveryETA, product.badge]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!text) return null;
  if (text.includes('tomorrow') || text.includes('next day')) return 'Tomorrow';
  if (
    text.includes('same day') ||
    text.includes('today') ||
    text.includes('2-3') ||
    text.includes('2–3')
  ) {
    return text.includes('2-3') || text.includes('2–3') ? 'Tomorrow' : 'Today';
  }
  if (text.includes('90 min') || text.includes('60 min') || text.includes('1 hour')) {
    return '30–60 mins';
  }
  if (text.includes('30 min') || text.includes('20 min') || text.includes('15 min')) {
    return 'Under 30 mins';
  }

  return null;
}

/** @deprecated Use extractEtaBucket */
export function extractEtaFromBadge(badge: string): string | null {
  return extractEtaBucket({ badge } as Product);
}

export function extractBrandFromProduct(product: Product, _categoryId?: string): string {
  const explicit = product.brand?.trim();
  if (explicit) return explicit;

  const name = product.name || '';
  for (const brand of KNOWN_BRANDS) {
    if (name.toLowerCase().includes(brand.toLowerCase())) return brand;
  }

  return 'Other';
}

export function normalizeGrade(productGrade: string, categoryId: string): string {
  const raw = (productGrade || '').trim();
  if (!raw) return '';

  const grades = GRADES_BY_CATEGORY[normalizeCategoryKey(categoryId)] ?? [];
  const direct = grades.find(
    (g) =>
      g.toLowerCase() === raw.toLowerCase() ||
      raw.toLowerCase().includes(g.toLowerCase()) ||
      g.toLowerCase().includes(raw.toLowerCase()),
  );
  if (direct) {
    // Prefer canonical display form
    if (direct === 'OPC43') return 'OPC 43';
    if (direct === 'OPC53') return 'OPC 53';
    return direct;
  }

  const key = normalizeCategoryKey(categoryId);
  if (key === 'cement') {
    if (raw === '53' || /opc\s*53/i.test(raw)) return 'OPC 53';
    if (raw === '43' || /opc\s*43/i.test(raw)) return 'OPC 43';
    if (/ppc/i.test(raw)) return 'PPC';
  }

  if (key === 'steel') {
    const fe = raw.match(/fe\s*(\d+)/i);
    if (fe) return `Fe${fe[1]}`;
  }

  return raw;
}

export function statusToAvailability(product: Product): string {
  const status = (product.status || '').toUpperCase();
  const stock = product.stockLeft ?? product.availableStock;

  if (
    status.includes('OUT') ||
    product.isAvailable === false ||
    (stock != null && stock <= 0)
  ) {
    return 'Out of Stock';
  }

  if (status.includes('LIMITED') || (stock != null && stock > 0 && stock <= 10)) {
    return 'Limited Stock';
  }

  return 'In Stock';
}

export function computePriceBounds(products: Product[]): [number, number] {
  if (products.length === 0) return [0, 5000];
  const prices = products.map((p) => p.retailPriceValue).filter((p) => p > 0);
  if (prices.length === 0) return [0, 5000];
  const min = Math.floor(Math.min(...prices) / 100) * 100;
  const max = Math.ceil(Math.max(...prices) / 100) * 100;
  return [Math.max(0, min - 200), Math.max(max + 500, min + 500)];
}

export function getBrandsWithCounts(
  products: Product[],
  categoryId: string,
): BrandOption[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const brand = extractBrandFromProduct(product, categoryId);
    counts.set(brand, (counts.get(brand) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      count,
      logoText: name.slice(0, 2).toUpperCase(),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getGradesFromProducts(
  products: Product[],
  categoryId: string,
): string[] {
  const found = new Set<string>();
  for (const product of products) {
    const grade = normalizeGrade(product.grade, categoryId);
    if (grade) found.add(grade);
  }

  const fallback = (GRADES_BY_CATEGORY[normalizeCategoryKey(categoryId)] ?? [])
    .filter((g) => g !== 'OPC43' && g !== 'OPC53')
    .map((g) => (g === 'OPC43' ? 'OPC 43' : g === 'OPC53' ? 'OPC 53' : g));

  if (found.size === 0) return fallback;

  const ordered = fallback.filter((g) => found.has(g));
  for (const g of found) {
    if (!ordered.includes(g)) ordered.push(g);
  }
  return ordered;
}

export function getEtaOptionsFromProducts(products: Product[]): string[] {
  const found = new Set<string>();
  for (const product of products) {
    const bucket = extractEtaBucket(product);
    if (bucket) found.add(bucket);
  }
  const ordered = ETA_OPTIONS.filter((o) => found.has(o));
  return ordered.length > 0 ? [...ordered] : [...ETA_OPTIONS];
}

export function getCategoryFilterConfig(
  categoryId: string,
  products: Product[],
): CategoryFilterConfig {
  const priceBounds = computePriceBounds(products);
  const visibleChips = getVisibleChips(categoryId);

  return {
    grades: getGradesFromProducts(products, categoryId),
    brands: getBrandsWithCounts(products, categoryId),
    priceBounds,
    etaOptions: getEtaOptionsFromProducts(products),
    availabilityOptions: [...AVAILABILITY_OPTIONS],
    visibleChips,
    advancedSections: getAdvancedSections(categoryId),
  };
}

export function formatPriceRangeLabel(
  min: number,
  max: number,
  bounds: [number, number],
): string {
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
  key: QuickFilterKey,
  activeFilters: ActiveFilters,
  config: CategoryFilterConfig,
): string {
  switch (key) {
    case 'grade': {
      const selected = activeFilters.grade;
      if (selected.length === 0) return 'Grade';
      if (selected.length === 1) return selected[0];
      return `Grade (${selected.length})`;
    }
    case 'eta':
      return activeFilters.eta ?? 'ETA';
    case 'brand': {
      const selected = activeFilters.brand;
      if (selected.length === 0) return 'Brand';
      if (selected.length === 1) return selected[0];
      return `Brand (${selected.length})`;
    }
    case 'priceRange':
      return formatPriceRangeLabel(
        activeFilters.priceRange[0],
        activeFilters.priceRange[1],
        config.priceBounds,
      );
    case 'availability': {
      if (isDefaultAvailability(activeFilters.availability)) return 'Availability';
      const selected = activeFilters.availability;
      if (selected.length === 1) return selected[0];
      return `Avail (${selected.length})`;
    }
    default:
      return key;
  }
}

export function isDefaultAvailability(availability: string[]): boolean {
  return (
    availability.length === DEFAULT_AVAILABILITY.length &&
    DEFAULT_AVAILABILITY.every((a) => availability.includes(a))
  );
}

export function createDefaultFilters(bounds: [number, number]): ActiveFilters {
  return {
    search: '',
    grade: [],
    eta: null,
    brand: [],
    priceRange: [...bounds] as [number, number],
    availability: [...DEFAULT_AVAILABILITY],
    discount: null,
    bulkPricing: null,
    sort: 'recommended',
  };
}

export function countActiveFilters(
  filters: ActiveFilters,
  bounds: [number, number],
): number {
  let count = 0;
  count += filters.grade.length;
  if (filters.eta) count += 1;
  count += filters.brand.length;
  if (filters.priceRange[0] > bounds[0] || filters.priceRange[1] < bounds[1]) {
    count += 1;
  }
  if (!isDefaultAvailability(filters.availability)) {
    count += filters.availability.length;
  }
  if (filters.discount != null) count += 1;
  if (filters.bulkPricing != null) count += 1;
  if (filters.sort !== 'recommended') count += 1;
  if (filters.search.trim()) count += 1;
  return count;
}

export function isPriceRangeActive(
  filters: ActiveFilters,
  bounds: [number, number],
): boolean {
  return filters.priceRange[0] > bounds[0] || filters.priceRange[1] < bounds[1];
}

export function matchesSearch(product: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    product.brand,
    product.name,
    product.detailName,
    product.category,
    product.categorySlug,
    product.grade,
    product.spec,
    product.sku,
    product.id,
    product.slug,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(q);
}

export function applyProductFilters(
  products: Product[],
  filters: ActiveFilters,
  config: CategoryFilterConfig,
  categoryId: string,
): Product[] {
  let result = products.filter((product) => {
    if (!matchesSearch(product, filters.search)) return false;

    if (filters.grade.length > 0) {
      const productGrade = normalizeGrade(product.grade, categoryId);
      if (
        !filters.grade.some(
          (g) => productGrade.toLowerCase() === g.toLowerCase(),
        )
      ) {
        return false;
      }
    }

    if (filters.eta) {
      const productEta = extractEtaBucket(product);
      if (productEta !== filters.eta) return false;
    }

    if (filters.brand.length > 0) {
      const productBrand = extractBrandFromProduct(product, categoryId);
      if (
        !filters.brand.some(
          (b) => productBrand.toLowerCase() === b.toLowerCase(),
        )
      ) {
        return false;
      }
    }

    if (isPriceRangeActive(filters, config.priceBounds)) {
      const price = product.retailPriceValue;
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }
    }

    if (filters.availability.length > 0) {
      const availability = statusToAvailability(product);
      if (!filters.availability.includes(availability)) return false;
    }

    if (filters.discount != null) {
      const discount = product.discountPercent ?? 0;
      if (discount < filters.discount) return false;
    }

    if (filters.bulkPricing === true) {
      const hasBulk =
        (product.bulkPricing?.length ?? 0) > 0 ||
        product.bulkPriceValue > 0 ||
        product.bulkThreshold > 0;
      if (!hasBulk) return false;
    }
    if (filters.bulkPricing === false) {
      const hasBulk =
        (product.bulkPricing?.length ?? 0) > 0 ||
        product.bulkPriceValue > 0 ||
        product.bulkThreshold > 0;
      if (hasBulk) return false;
    }

    return true;
  });

  result = sortProducts(result, filters.sort);
  return result;
}

export function sortProducts(products: Product[], sort: SortOption): Product[] {
  const list = [...products];

  switch (sort) {
    case 'price_low':
      return list.sort((a, b) => a.retailPriceValue - b.retailPriceValue);
    case 'price_high':
      return list.sort((a, b) => b.retailPriceValue - a.retailPriceValue);
    case 'discount':
      return list.sort(
        (a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0),
      );
    case 'newest':
      return list.sort((a, b) => {
        if (a.isNewArrival && !b.isNewArrival) return -1;
        if (!a.isNewArrival && b.isNewArrival) return 1;
        return 0;
      });
    case 'fastest_delivery':
      return list.sort((a, b) => {
        const am = extractDeliveryMinutes(a) ?? Number.MAX_SAFE_INTEGER;
        const bm = extractDeliveryMinutes(b) ?? Number.MAX_SAFE_INTEGER;
        return am - bm;
      });
    case 'rating':
      return list.sort(
        (a, b) =>
          (b.averageRating ?? b.rating ?? 0) - (a.averageRating ?? a.rating ?? 0),
      );
    case 'popularity':
      return list.sort((a, b) => {
        if (a.isBestSelling && !b.isBestSelling) return -1;
        if (!a.isBestSelling && b.isBestSelling) return 1;
        return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      });
    case 'recommended':
    default:
      return list.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        if (a.isBestSelling && !b.isBestSelling) return -1;
        if (!a.isBestSelling && b.isBestSelling) return 1;
        return 0;
      });
  }
}

/** Map UI filters → API query params for future server-side filtering. */
export function filtersToQueryParams(filters: ActiveFilters, bounds: [number, number]) {
  const params: {
    search?: string;
    brand?: string;
    grade?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price' | 'retailPrice' | 'name' | 'sales' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  } = {};

  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.brand.length === 1) params.brand = filters.brand[0];
  if (filters.grade.length === 1) params.grade = filters.grade[0];

  if (!isDefaultAvailability(filters.availability) && filters.availability.length === 1) {
    const map: Record<string, string> = {
      'In Stock': 'IN STOCK',
      'Limited Stock': 'LIMITED STOCK',
      'Out of Stock': 'OUT OF STOCK',
    };
    params.status = map[filters.availability[0]] ?? filters.availability[0];
  }

  if (isPriceRangeActive(filters, bounds)) {
    params.minPrice = filters.priceRange[0];
    params.maxPrice = filters.priceRange[1];
  }

  switch (filters.sort) {
    case 'price_low':
      params.sortBy = 'price';
      params.sortOrder = 'asc';
      break;
    case 'price_high':
      params.sortBy = 'price';
      params.sortOrder = 'desc';
      break;
    case 'popularity':
      params.sortBy = 'sales';
      params.sortOrder = 'desc';
      break;
    case 'newest':
      params.sortBy = 'createdAt';
      params.sortOrder = 'desc';
      break;
    default:
      break;
  }

  return params;
}

export function cloneFilters(filters: ActiveFilters): ActiveFilters {
  return {
    ...filters,
    grade: [...filters.grade],
    brand: [...filters.brand],
    availability: [...filters.availability],
    priceRange: [...filters.priceRange] as [number, number],
  };
}
