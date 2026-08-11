import type { Product } from '@/types/catalog';
import type {
  ActiveFilters,
  BrandOption,
  CategoryFilterConfig,
  FilterChip,
  FilterKey,
  PricePresetOption,
  QuickFilterKey,
  SortOption,
} from '@/types/filter.types';

/** Quick chips — Brand → Type → Grade → Price (Filters button is separate). */
export const FILTER_CHIPS: FilterChip[] = [
  { key: 'brand', label: 'Brand', icon: 'business-outline' },
  { key: 'productType', label: 'Type', icon: 'cube-outline' },
  { key: 'grade', label: 'Grade', icon: 'layers-outline' },
  { key: 'priceRange', label: 'Price', icon: 'pricetag-outline' },
];

/** Brick product-type display labels ↔ API codes */
export const BRICK_PRODUCT_TYPE_OPTIONS = [
  { code: 'RED_BRICKS', label: 'Red Bricks' },
  { code: 'GREY_ASH_BRICKS', label: 'Grey Ash Bricks (Fly Ash Bricks)' },
] as const;

/** Brick grade display labels ↔ API codes */
export const BRICK_GRADE_OPTIONS = [
  { code: 'A_PLUS', label: 'A+' },
  { code: 'A', label: 'A' },
  { code: 'B_PLUS', label: 'B+' },
] as const;

export function brickProductTypeLabelToCode(label: string): string | undefined {
  const normalized = label.trim().toLowerCase();
  const hit = BRICK_PRODUCT_TYPE_OPTIONS.find(
    (o) =>
      o.label.toLowerCase() === normalized ||
      o.code.toLowerCase() === normalized ||
      (normalized.includes('fly') && o.code === 'GREY_ASH_BRICKS') ||
      (normalized.includes('grey') && o.code === 'GREY_ASH_BRICKS') ||
      (normalized.includes('red') && o.code === 'RED_BRICKS'),
  );
  return hit?.code;
}

export function brickGradeLabelToCode(label: string): string | undefined {
  const normalized = label.trim().toUpperCase().replace(/\s+/g, '_');
  const hit = BRICK_GRADE_OPTIONS.find(
    (o) =>
      o.label.toUpperCase() === label.trim().toUpperCase() ||
      o.code === normalized ||
      o.code === label.trim().toUpperCase(),
  );
  return hit?.code;
}

export function brickProductTypeCodeToLabel(code?: string | null): string {
  if (!code) return '';
  const hit = BRICK_PRODUCT_TYPE_OPTIONS.find(
    (o) => o.code === code || o.code.toLowerCase() === code.toLowerCase(),
  );
  return hit?.label ?? code;
}

export function brickGradeCodeToLabel(code?: string | null): string {
  if (!code) return '';
  const hit = BRICK_GRADE_OPTIONS.find(
    (o) => o.code === code || o.label === code || o.code.toLowerCase() === code.toLowerCase(),
  );
  return hit?.label ?? code;
}

/** Absolute retail-style presets shown in the Price section. */
export const ABSOLUTE_PRICE_PRESETS: PricePresetOption[] = [
  { id: 'under-500', label: 'Under ₹500', range: [0, 500] },
  { id: '500-1000', label: '₹500–₹1000', range: [500, 1000] },
  { id: '1000-5000', label: '₹1000–₹5000', range: [1000, 5000] },
  { id: '5000-plus', label: 'Above ₹5000', range: [5000, Number.POSITIVE_INFINITY] },
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

/** @deprecated Use ABSOLUTE_PRICE_PRESETS */
export const PRICE_PRESETS = ABSOLUTE_PRICE_PRESETS.map((p) => ({
  label: p.label,
  range: [
    p.range[0],
    p.range[1] === Number.POSITIVE_INFINITY ? 100000 : p.range[1],
  ] as [number, number],
}));

/**
 * Context-aware grade catalogs. Only grades present in the current product
 * list are shown; these act as ordered fallbacks / preferred labels.
 */
const GRADES_BY_CATEGORY: Record<string, string[]> = {
  cement: ['PPC', 'OPC 43', 'OPC 53', 'PSC', 'Premium', 'Industrial'],
  rmc: ['M20', 'M25', 'M30', 'M35', 'M40'],
  /** Legacy alias */
  steel: ['M20', 'M25', 'M30', 'M35', 'M40'],
  paint: ['1L', '4L', '10L'],
  paints: ['1L', '4L', '10L'],
  adhesives: ['250ml', '500ml', '1L', '4L'],
  sand: ['Zone 1', 'Zone 2', 'Fine'],
  bricks: BRICK_GRADE_OPTIONS.map((o) => o.label),
  'grey-fill-sand': ['G1', 'G2', 'G3', 'Premium'],
  'stone-chips': ['Grade A', 'Grade B', 'Grade C'],
  aggregates: ['Standard', 'Fine', 'Coarse'],
};

const PRODUCT_TYPES_BY_CATEGORY: Record<string, string[]> = {
  bricks: BRICK_PRODUCT_TYPE_OPTIONS.map((o) => o.label),
};

/** Always Brand → Grade → Price on the listing bar. */
const DEFAULT_CHIPS: QuickFilterKey[] = ['brand', 'grade', 'priceRange'];

/** Full-sheet sections — Brand, Grade, Price only. */
const DEFAULT_SECTIONS: FilterKey[] = ['brand', 'grade', 'priceRange'];

const BRICKS_CHIPS: QuickFilterKey[] = ['productType', 'grade', 'priceRange'];
const BRICKS_SECTIONS: FilterKey[] = ['productType', 'grade', 'brand', 'priceRange'];

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
  'TATA Tiscon',
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
  if (key === 'bricks') return [...BRICKS_CHIPS];
  return [...DEFAULT_CHIPS];
}

export function getAdvancedSections(categoryId: string): FilterKey[] {
  const key = normalizeCategoryKey(categoryId);
  if (key === 'bricks') return [...BRICKS_SECTIONS];
  return [...DEFAULT_SECTIONS];
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

  const key = normalizeCategoryKey(categoryId);
  const grades = GRADES_BY_CATEGORY[key] ?? [];

  const direct = grades.find(
    (g) =>
      g.toLowerCase() === raw.toLowerCase() ||
      raw.toLowerCase().includes(g.toLowerCase()) ||
      g.toLowerCase().includes(raw.toLowerCase()),
  );
  if (direct) return direct;

  if (key === 'cement') {
    if (raw === '53' || /opc\s*53/i.test(raw)) return 'OPC 53';
    if (raw === '43' || /opc\s*43/i.test(raw)) return 'OPC 43';
    if (/psc/i.test(raw)) return 'PSC';
    if (/ppc/i.test(raw)) return 'PPC';
  }

  if (key === 'bricks') {
    return brickGradeCodeToLabel(raw) || raw;
  }

  if (key === 'rmc' || key === 'steel') {
    const mix = raw.match(/m\s*(\d+)/i);
    if (mix) return `M${mix[1]}`;
    const mm = raw.match(/(\d+)\s*mm/i);
    if (mm) return `${mm[1]}mm`;
    if (/500\s*d/i.test(raw)) return '500D';
    if (/550\s*d/i.test(raw)) return '550D';
    const fe = raw.match(/fe\s*(\d+)/i);
    if (fe) return `Fe ${fe[1]}`;
  }

  if (key === 'paint' || key === 'paints' || key === 'adhesives') {
    const vol = raw.match(/(\d+(?:\.\d+)?)\s*(ml|l|litre|liter)s?/i);
    if (vol) {
      const n = vol[1];
      const unit = vol[2].toLowerCase().startsWith('m') ? 'ml' : 'L';
      return `${n}${unit}`;
    }
  }

  return raw;
}

export function computePriceBounds(products: Product[]): [number, number] {
  if (products.length === 0) return [0, 5000];
  const prices = products.map((p) => p.retailPriceValue).filter((p) => p > 0);
  if (prices.length === 0) return [0, 5000];
  const min = Math.floor(Math.min(...prices) / 100) * 100;
  const max = Math.ceil(Math.max(...prices) / 100) * 100;
  return [Math.max(0, min - 200), Math.max(max + 500, min + 500)];
}

/**
 * Absolute presets for the Price filter. Catalog-aware upper bound for ₹5000+.
 * Presets that cannot match any product are still shown (counts will be 0).
 */
export function buildPricePresets(
  _products: Product[],
  bounds: [number, number],
): PricePresetOption[] {
  return ABSOLUTE_PRICE_PRESETS.map((preset) => {
    const max =
      preset.range[1] === Number.POSITIVE_INFINITY
        ? Math.max(bounds[1], 5000)
        : preset.range[1];
    return { ...preset, range: [preset.range[0], max] as [number, number] };
  });
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

export function getProductTypesFromProducts(
  products: Product[],
  categoryId: string,
): string[] {
  const key = normalizeCategoryKey(categoryId);
  const preferred = PRODUCT_TYPES_BY_CATEGORY[key] ?? [];
  if (key === 'bricks') {
    // Fixed brick type catalog — always available for filter UI
    return [...preferred];
  }

  const found = new Set<string>();
  for (const product of products) {
    const label =
      product.productTypeLabel?.trim() ||
      brickProductTypeCodeToLabel(product.productType) ||
      '';
    if (label) found.add(label);
  }
  if (found.size === 0) return preferred;
  const ordered = preferred.filter((t) => found.has(t));
  for (const t of found) {
    if (!ordered.includes(t)) ordered.push(t);
  }
  return ordered;
}

export function getGradesFromProducts(
  products: Product[],
  categoryId: string,
): string[] {
  const key = normalizeCategoryKey(categoryId);
  const preferred = GRADES_BY_CATEGORY[key] ?? [];

  // Bricks: always expose A+ / A / B+ regardless of loaded facets
  if (key === 'bricks') {
    return [...preferred];
  }

  const found = new Set<string>();
  for (const product of products) {
    const grade = normalizeGrade(
      product.gradeLabel || product.grade,
      categoryId,
    );
    if (grade) found.add(grade);

    // Also mine diameter / pack size from name + spec for rmc/paint/adhesives
    if (key === 'rmc' || key === 'steel') {
      const mix = `${product.name} ${product.spec ?? ''}`.match(/m\s*(\d+)/i);
      if (mix) found.add(`M${mix[1]}`);
      const mm = `${product.name} ${product.spec ?? ''}`.match(/(\d+)\s*mm/i);
      if (mm) found.add(`${mm[1]}mm`);
    }
    if (key === 'paint' || key === 'paints' || key === 'adhesives') {
      const vol = `${product.name} ${product.spec ?? ''}`.match(
        /(\d+(?:\.\d+)?)\s*(ml|l|litre|liter)s?/i,
      );
      if (vol) {
        const unit = vol[2].toLowerCase().startsWith('m') ? 'ml' : 'L';
        found.add(`${vol[1]}${unit}`);
      }
    }
  }

  if (found.size === 0) {
    // No product grades yet (still loading) — return empty so UI doesn't flash options
    return products.length === 0 ? [] : preferred;
  }

  const ordered = preferred.filter((g) => found.has(g));
  for (const g of found) {
    if (!ordered.includes(g)) ordered.push(g);
  }
  return ordered;
}

export function getCategoryFilterConfig(
  categoryId: string,
  products: Product[],
): CategoryFilterConfig {
  const priceBounds = computePriceBounds(products);

  return {
    grades: getGradesFromProducts(products, categoryId),
    productTypes: getProductTypesFromProducts(products, categoryId),
    brands: getBrandsWithCounts(products, categoryId),
    priceBounds,
    pricePresets: buildPricePresets(products, priceBounds),
    visibleChips: getVisibleChips(categoryId),
    advancedSections: getAdvancedSections(categoryId),
  };
}

export function formatPriceRangeLabel(
  min: number,
  max: number,
  bounds: [number, number],
): string {
  const formatK = (n: number) => {
    if (!Number.isFinite(n)) return '∞';
    if (n >= 1000) return `₹${Math.round(n / 100) / 10}K`.replace('.0K', 'K');
    return `₹${n.toLocaleString('en-IN')}`;
  };

  if (min > max) return 'Price';

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
    case 'productType': {
      const selected = activeFilters.productType;
      if (selected.length === 0) return 'Type';
      if (selected.length === 1) {
        // Shorten long brick labels on chip
        if (selected[0].toLowerCase().includes('grey')) return 'Grey Ash';
        if (selected[0].toLowerCase().includes('red')) return 'Red Bricks';
        return selected[0];
      }
      return `Type (${selected.length})`;
    }
    case 'brand': {
      const selected = activeFilters.brand;
      if (selected.length === 0) return 'Brand';
      if (selected.length === 1) return selected[0];
      return `Brand (${selected.length})`;
    }
    case 'priceRange': {
      if (activeFilters.pricePresets.length === 1) {
        return (
          config.pricePresets.find((p) => p.id === activeFilters.pricePresets[0])
            ?.label ?? 'Price'
        );
      }
      if (activeFilters.pricePresets.length > 1) {
        return `Price (${activeFilters.pricePresets.length})`;
      }
      return formatPriceRangeLabel(
        activeFilters.priceRange[0],
        activeFilters.priceRange[1],
        config.priceBounds,
      );
    }
    default:
      return key;
  }
}

export function createDefaultFilters(bounds: [number, number] = [0, 5000]): ActiveFilters {
  return {
    search: '',
    grade: [],
    productType: [],
    brand: [],
    priceRange: [...bounds] as [number, number],
    pricePresets: [],
    discount: null,
    bulkPricing: null,
    sort: 'recommended',
  };
}

/**
 * Reconcile persisted / in-memory filters with the latest catalog price bounds.
 *
 * This runs synchronously (same render as products arriving) so we never flash
 * a stale "Under ₹5K" price filter against high-priced catalogs like RMC.
 */
export function reconcileFiltersWithBounds(
  filters: ActiveFilters,
  bounds: [number, number],
  options?: { productsReady?: boolean },
): ActiveFilters {
  const next = cloneFilters(filters);
  const productsReady = options?.productsReady ?? true;

  // Until products load, never treat price as an intentional filter
  if (!productsReady) {
    next.priceRange = [...bounds] as [number, number];
    next.pricePresets = [];
    return next;
  }

  if (next.pricePresets.length > 0) {
    // Presets drive filtering; keep slider at full catalog bounds
    next.priceRange = [...bounds] as [number, number];
    return next;
  }

  const [lo, hi] = next.priceRange;

  // Inverted / empty
  if (lo > hi) {
    next.priceRange = [...bounds] as [number, number];
    return next;
  }

  // Stale placeholder (e.g. [0, 5000] while RMC bounds start at ~60k)
  // or any range that does not overlap the catalog at all.
  const noOverlap = hi < bounds[0] || lo > bounds[1];
  const looksLikePlaceholder =
    lo === 0 && hi === 5000 && (bounds[0] > 5000 || bounds[1] > 5000);
  const isFullPreviousDefault =
    lo <= 0 && hi >= 5000 && hi <= 10000 && bounds[1] > hi;

  if (noOverlap || looksLikePlaceholder || isFullPreviousDefault) {
    next.priceRange = [...bounds] as [number, number];
    return next;
  }

  // Clamp an intentional custom range into current bounds
  const clampedLo = Math.max(bounds[0], Math.min(lo, bounds[1]));
  const clampedHi = Math.min(bounds[1], Math.max(hi, bounds[0]));
  next.priceRange =
    clampedLo <= clampedHi
      ? ([clampedLo, clampedHi] as [number, number])
      : ([...bounds] as [number, number]);

  return next;
}

/**
 * Normalize persisted / legacy filter shapes (strips removed Availability, ETA, etc.).
 */
export function normalizeFilters(
  raw: Partial<ActiveFilters> & {
    eta?: string[] | string | null;
    availability?: string[];
  },
  bounds: [number, number],
): ActiveFilters {
  let priceRange: [number, number] = Array.isArray(raw.priceRange)
    ? ([...raw.priceRange] as [number, number])
    : ([...bounds] as [number, number]);

  if (priceRange[0] > priceRange[1]) {
    priceRange = [...bounds] as [number, number];
  }

  return reconcileFiltersWithBounds(
    {
      search: typeof raw.search === 'string' ? raw.search : '',
      grade: Array.isArray(raw.grade) ? [...raw.grade] : [],
      productType: Array.isArray(raw.productType) ? [...raw.productType] : [],
      brand: Array.isArray(raw.brand) ? [...raw.brand] : [],
      priceRange,
      pricePresets: Array.isArray(raw.pricePresets) ? [...raw.pricePresets] : [],
      discount: raw.discount ?? null,
      bulkPricing: raw.bulkPricing ?? null,
      sort: raw.sort ?? 'recommended',
    },
    bounds,
    { productsReady: bounds[1] > 5000 || bounds[0] > 0 || true },
  );
}

export function countActiveFilters(
  filters: ActiveFilters,
  bounds: [number, number],
): number {
  let count = 0;
  count += filters.grade.length;
  count += filters.productType.length;
  count += filters.brand.length;
  if (filters.pricePresets.length > 0) {
    count += filters.pricePresets.length;
  } else if (isPriceRangeActive(filters, bounds)) {
    count += 1;
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
  if (filters.pricePresets.length > 0) return true;
  const [min, max] = filters.priceRange;
  if (min > max) return false;
  // Stale / non-overlapping ranges are NOT active filters
  if (max < bounds[0] || min > bounds[1]) return false;
  return min > bounds[0] || max < bounds[1];
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
    product.gradeLabel,
    product.productType,
    product.productTypeLabel,
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

function productMatchesPrice(
  price: number,
  filters: ActiveFilters,
  config: CategoryFilterConfig,
): boolean {
  if (filters.pricePresets.length > 0) {
    return filters.pricePresets.some((id) => {
      const preset = config.pricePresets.find((p) => p.id === id);
      if (!preset) return false;
      const [lo, hi] = preset.range;
      const upper = Number.isFinite(hi) ? hi : Number.POSITIVE_INFINITY;
      return price >= lo && price <= upper;
    });
  }

  if (!isPriceRangeActive(filters, config.priceBounds)) return true;

  const [min, max] = filters.priceRange;
  if (min > max) return true;
  return price >= min && price <= max;
}

type FilterDimension =
  | 'search'
  | 'grade'
  | 'productType'
  | 'brand'
  | 'price'
  | 'discount'
  | 'bulkPricing';

function matchesDimension(
  product: Product,
  filters: ActiveFilters,
  config: CategoryFilterConfig,
  categoryId: string,
  dimension: FilterDimension,
): boolean {
  switch (dimension) {
    case 'search':
      return matchesSearch(product, filters.search);
    case 'grade': {
      if (filters.grade.length === 0) return true;
      const productGrade = normalizeGrade(
        product.gradeLabel || product.grade,
        categoryId,
      );
      const nameSpec = `${product.name} ${product.spec ?? ''} ${product.gradeLabel ?? ''}`;
      return filters.grade.some((g) => {
        if (productGrade.toLowerCase() === g.toLowerCase()) return true;
        const code = brickGradeLabelToCode(g);
        if (code && (product.grade === code || product.gradeLabel === g)) return true;
        return nameSpec.toLowerCase().includes(g.toLowerCase());
      });
    }
    case 'productType': {
      if (filters.productType.length === 0) return true;
      const label =
        product.productTypeLabel?.trim() ||
        brickProductTypeCodeToLabel(product.productType);
      return filters.productType.some((t) => {
        if (label && label.toLowerCase() === t.toLowerCase()) return true;
        const code = brickProductTypeLabelToCode(t);
        if (code && product.productType === code) return true;
        const hay = `${product.name} ${product.productTypeLabel ?? ''}`.toLowerCase();
        return hay.includes(t.toLowerCase()) || (t.toLowerCase().includes('fly') && hay.includes('ash'));
      });
    }
    case 'brand': {
      if (filters.brand.length === 0) return true;
      const productBrand = extractBrandFromProduct(product, categoryId);
      return filters.brand.some(
        (b) => productBrand.toLowerCase() === b.toLowerCase(),
      );
    }
    case 'price':
      return productMatchesPrice(product.retailPriceValue, filters, config);
    case 'discount': {
      if (filters.discount == null) return true;
      return (product.discountPercent ?? 0) >= filters.discount;
    }
    case 'bulkPricing': {
      if (filters.bulkPricing == null) return true;
      const hasBulk =
        (product.bulkPricing?.length ?? 0) > 0 ||
        product.bulkPriceValue > 0 ||
        product.bulkThreshold > 0;
      return filters.bulkPricing ? hasBulk : !hasBulk;
    }
    default:
      return true;
  }
}

const PIPELINE: FilterDimension[] = [
  'search',
  'productType',
  'grade',
  'brand',
  'price',
  'discount',
  'bulkPricing',
];

/**
 * Always derive from the original product list — never mutate or re-filter
 * an already-filtered array.
 *
 * Pipeline: Search → Grade → Brand → Price → Discount → Bulk → Sort
 */
export function applyProductFilters(
  products: Product[],
  filters: ActiveFilters,
  config: CategoryFilterConfig,
  categoryId: string,
  options?: { skipSort?: boolean; excludeDimension?: FilterDimension },
): Product[] {
  const result = products.filter((product) =>
    PIPELINE.every((dimension) => {
      if (options?.excludeDimension === dimension) return true;
      return matchesDimension(product, filters, config, categoryId, dimension);
    }),
  );

  if (options?.skipSort) return result;
  return sortProducts(result, filters.sort);
}

/**
 * Facet counts for a dimension, respecting all other active draft filters.
 */
export function computeFacetCounts(
  products: Product[],
  filters: ActiveFilters,
  config: CategoryFilterConfig,
  categoryId: string,
  dimension: 'brand' | 'grade' | 'productType' | 'price' | 'discount',
): Record<string, number> {
  const base = applyProductFilters(products, filters, config, categoryId, {
    skipSort: true,
    excludeDimension:
      dimension === 'price'
        ? 'price'
        : dimension === 'discount'
          ? 'discount'
          : dimension,
  });

  const counts: Record<string, number> = {};

  if (dimension === 'brand') {
    for (const product of base) {
      const brand = extractBrandFromProduct(product, categoryId);
      counts[brand] = (counts[brand] ?? 0) + 1;
    }
  } else if (dimension === 'productType') {
    for (const product of base) {
      const label =
        product.productTypeLabel?.trim() ||
        brickProductTypeCodeToLabel(product.productType);
      if (label) counts[label] = (counts[label] ?? 0) + 1;
    }
  } else if (dimension === 'grade') {
    for (const product of base) {
      const grade = normalizeGrade(
        product.gradeLabel || product.grade,
        categoryId,
      );
      if (grade) counts[grade] = (counts[grade] ?? 0) + 1;
      // Diameter / pack from name
      const key = normalizeCategoryKey(categoryId);
      if (key === 'rmc' || key === 'steel') {
        const mm = `${product.name} ${product.spec ?? ''}`.match(/(\d+)\s*mm/i);
        if (mm) {
          const label = `${mm[1]}mm`;
          counts[label] = (counts[label] ?? 0) + 1;
        }
      }
    }
  } else if (dimension === 'price') {
    for (const preset of config.pricePresets) {
      const [lo, hi] = preset.range;
      const upper = Number.isFinite(hi) ? hi : Number.POSITIVE_INFINITY;
      counts[preset.id] = base.filter(
        (p) => p.retailPriceValue >= lo && p.retailPriceValue <= upper,
      ).length;
    }
  } else if (dimension === 'discount') {
    for (const option of DISCOUNT_OPTIONS) {
      if (option.value == null) {
        counts['any'] = base.length;
      } else {
        counts[String(option.value)] = base.filter(
          (p) => (p.discountPercent ?? 0) >= option.value!,
        ).length;
      }
    }
  }

  return counts;
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

/** Map UI filters → API query params for server-side filtering. */
export function filtersToQueryParams(
  filters: ActiveFilters,
  bounds: [number, number],
  config?: CategoryFilterConfig,
  categoryId?: string,
) {
  const params: {
    search?: string;
    brand?: string;
    grade?: string;
    productType?: string;
    brickType?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price' | 'retailPrice' | 'name' | 'sales' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  } = {};

  const key = normalizeCategoryKey(categoryId ?? '');

  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.brand.length === 1) params.brand = filters.brand[0];

  if (filters.grade.length === 1) {
    const gradeLabel = filters.grade[0];
    params.grade =
      key === 'bricks'
        ? brickGradeLabelToCode(gradeLabel) ?? gradeLabel
        : gradeLabel;
  }

  if (filters.productType.length === 1) {
    const typeLabel = filters.productType[0];
    const code = brickProductTypeLabelToCode(typeLabel) ?? typeLabel;
    params.productType = code;
    if (key === 'bricks') params.brickType = code;
  }

  if (filters.pricePresets.length === 1 && config) {
    const preset = config.pricePresets.find((p) => p.id === filters.pricePresets[0]);
    if (preset) {
      params.minPrice = preset.range[0];
      if (Number.isFinite(preset.range[1])) params.maxPrice = preset.range[1];
    }
  } else if (isPriceRangeActive(filters, bounds) && filters.pricePresets.length === 0) {
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
    productType: [...(filters.productType ?? [])],
    brand: [...filters.brand],
    pricePresets: [...filters.pricePresets],
    priceRange: [...filters.priceRange] as [number, number],
  };
}

/** Resolve a preset selection into a display label for active chips. */
export function getPricePresetLabel(
  presetId: string,
  config: CategoryFilterConfig,
): string {
  return config.pricePresets.find((p) => p.id === presetId)?.label ?? presetId;
}

function filtersEqual(a: ActiveFilters, b: ActiveFilters): boolean {
  const aTypes = a.productType ?? [];
  const bTypes = b.productType ?? [];
  return (
    a.search === b.search &&
    a.sort === b.sort &&
    a.discount === b.discount &&
    a.bulkPricing === b.bulkPricing &&
    a.priceRange[0] === b.priceRange[0] &&
    a.priceRange[1] === b.priceRange[1] &&
    a.grade.length === b.grade.length &&
    a.grade.every((g, i) => g === b.grade[i]) &&
    aTypes.length === bTypes.length &&
    aTypes.every((g, i) => g === bTypes[i]) &&
    a.brand.length === b.brand.length &&
    a.brand.every((g, i) => g === b.brand[i]) &&
    a.pricePresets.length === b.pricePresets.length &&
    a.pricePresets.every((g, i) => g === b.pricePresets[i])
  );
}

export { filtersEqual };
