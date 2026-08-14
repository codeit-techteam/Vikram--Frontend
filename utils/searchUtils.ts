import {
  ALL_PRODUCTS,
  SEARCH_CATEGORIES,
  type SearchProduct,
} from '@constants/searchData';
import { getExtensionSearchProducts } from '@constants/catalogExtensions';
import type { Product } from '@/types/catalog';

export interface TextSegment {
  text: string;
  isMatch: boolean;
}

export interface Suggestion {
  id: string;
  text: string;
  category?: string;
  type: 'product' | 'brand' | 'category' | 'grade';
}

export type SearchSortOption =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'popular'
  | 'fastest';

export interface SearchFilters {
  category?: string | null;
  inStock: boolean;
}

export const EMPTY_SEARCH_FILTERS: SearchFilters = {
  category: null,
  inStock: false,
};

export const POPULAR_SEARCH_TERMS = [
  'UltraTech Cement',
  'RMC M25',
  'Sand & Gravel',
] as const;

export const POPULAR_CATEGORY_ICONS: Record<string, string> = {
  cement: '🧱',
  rmc: '🚛',
  steel: '🚛',
  aggregates: '🪨',
  stone: '🪨',
  'stone-chips': '🪨',
  sand: '🏖',
  bricks: '🧱',
  waterproofing: '💧',
  adhesives: '🧴',
  putty: '🪣',
  paint: '🎨',
};

export const POPULAR_CATEGORIES = [
  { id: 'cement', label: 'Cement', icon: '🧱' },
  { id: 'rmc', label: 'RMC', icon: '🚛' },
  { id: 'aggregates', label: 'Aggregates', icon: '🪨' },
  { id: 'bricks', label: 'Bricks', icon: '🧱' },
  { id: 'sand', label: 'Sand', icon: '🏖' },
  { id: 'waterproofing', label: 'Waterproofing', icon: '💧' },
] as const;

const PREFERRED_CATEGORY_ORDER = [
  'cement',
  'rmc',
  'aggregates',
  'stone-chips',
  'bricks',
  'sand',
  'waterproofing',
] as const;

const GRADE_TERMS = ['OPC 53', 'M25', 'M20', 'A+', 'A', 'B+', 'PPC'];

export function highlightMatch(text: string, query: string): TextSegment[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [{ text, isMatch: false }];
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);

  if (idx === -1) {
    return [{ text, isMatch: false }];
  }

  const segments: TextSegment[] = [];
  if (idx > 0) {
    segments.push({ text: text.slice(0, idx), isMatch: false });
  }
  segments.push({ text: text.slice(idx, idx + trimmed.length), isMatch: true });
  if (idx + trimmed.length < text.length) {
    segments.push({ text: text.slice(idx + trimmed.length), isMatch: false });
  }

  return segments;
}

export function getCategoryIcon(slug: string): string {
  return POPULAR_CATEGORY_ICONS[slug.toLowerCase()] ?? '📦';
}

export function sortCategoriesForSearch<T extends { slug: string }>(
  categories: T[],
): T[] {
  const rank = (slug: string) => {
    const idx = PREFERRED_CATEGORY_ORDER.indexOf(
      slug.toLowerCase() as (typeof PREFERRED_CATEGORY_ORDER)[number],
    );
    return idx === -1 ? PREFERRED_CATEGORY_ORDER.length + 1 : idx;
  };
  return [...categories].sort((a, b) => rank(a.slug) - rank(b.slug));
}

export function sortSearchProducts(
  products: Product[],
  sort: SearchSortOption,
): Product[] {
  const copy = [...products];
  switch (sort) {
    case 'price_asc':
      return copy.sort((a, b) => a.retailPriceValue - b.retailPriceValue);
    case 'price_desc':
      return copy.sort((a, b) => b.retailPriceValue - a.retailPriceValue);
    case 'popular':
      return copy.sort((a, b) => Number(b.isBestSelling) - Number(a.isBestSelling));
    case 'fastest':
      return copy.sort((a, b) => {
        const etaA = a.estimatedDeliveryMinutes ?? Number.POSITIVE_INFINITY;
        const etaB = b.estimatedDeliveryMinutes ?? Number.POSITIVE_INFINITY;
        return etaA - etaB;
      });
    case 'relevance':
    default:
      return copy;
  }
}

export function mapSortToProductQuery(sort: SearchSortOption): {
  sortBy?: 'price' | 'retailPrice' | 'name' | 'sales' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
} {
  switch (sort) {
    case 'price_asc':
      return { sortBy: 'price', sortOrder: 'asc' };
    case 'price_desc':
      return { sortBy: 'price', sortOrder: 'desc' };
    case 'popular':
      return { sortBy: 'sales', sortOrder: 'desc' };
    case 'fastest':
    case 'relevance':
    default:
      return {};
  }
}

export function isOfflineError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { message?: string; code?: string; response?: unknown };
  if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') return true;
  if (!err.response && typeof err.message === 'string' && /network/i.test(err.message)) {
    return true;
  }
  return false;
}

/** Local fallback suggestions when the suggestions API is slow or empty. */
export function fetchLocalSuggestions(query: string): Suggestion[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const q = trimmed.toLowerCase();
  const seen = new Set<string>();
  const suggestions: Suggestion[] = [];

  const add = (suggestion: Suggestion) => {
    const key = suggestion.text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push(suggestion);
  };

  SEARCH_CATEGORIES.filter(
    (c) => c.label.toLowerCase().includes(q) || c.id.includes(q),
  ).forEach((c) => {
    add({
      id: `category-${c.id}`,
      text: c.label,
      category: c.label,
      type: 'category',
    });
  });

  GRADE_TERMS.filter((g) => g.toLowerCase().includes(q)).forEach((grade) => {
    add({ id: `grade-${grade}`, text: grade, type: 'grade' });
  });

  return suggestions.slice(0, 6);
}

export function sortSearchResults(
  products: SearchProduct[],
  sort: SearchSortOption,
): SearchProduct[] {
  const copy = [...products];
  switch (sort) {
    case 'price_asc':
      return copy.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return copy.sort((a, b) => b.price - a.price);
    case 'popular':
    case 'fastest':
    case 'relevance':
    default:
      return copy;
  }
}

export function getCategoryLabel(categoryId: string): string {
  const match = POPULAR_CATEGORIES.find((c) => c.id === categoryId);
  return match?.label ?? categoryId;
}

/** Kept for catalogExtensions / older local fallbacks. */
export function searchProducts(query: string): SearchProduct[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const q = trimmed.toLowerCase();
  const catalog = [...ALL_PRODUCTS, ...getExtensionSearchProducts()];
  return catalog.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q),
  );
}
