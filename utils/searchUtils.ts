import {
  ALL_PRODUCTS,
  SEARCH_CATEGORIES,
  type SearchProduct,
} from '@constants/searchData';
import { getExtensionSearchProducts } from '@constants/catalogExtensions';

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

export type SearchSortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest';

export const POPULAR_SEARCH_TERMS = [
  'UltraTech Cement',
  'RMC M25',
  'Sand & Gravel',
] as const;

export const POPULAR_CATEGORIES = [
  { id: 'cement', label: 'Cement', icon: '🧱' },
  { id: 'rmc', label: 'RMC', icon: '🚛' },
  { id: 'stone', label: 'Aggregates', icon: '🪨' },
  { id: 'bricks', label: 'Bricks', icon: '🪵' },
] as const;

const GRADE_TERMS = ['OPC 53', 'M25', 'M20', 'A+', 'A', 'B+', 'PPC'];

const BRAND_NAMES = [...new Set(ALL_PRODUCTS.map((p) => p.brand))];

const CATEGORY_LABELS: Record<string, string> = {
  cement: 'Cement',
  rmc: 'RMC',
  steel: 'RMC',
  stone: 'Aggregates',
  sand: 'Sand',
  bricks: 'Bricks',
};

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

function scoreProduct(product: SearchProduct, query: string): number {
  const q = query.toLowerCase();
  const name = product.name.toLowerCase();
  const brand = product.brand.toLowerCase();
  const category = product.category.toLowerCase();

  if (name === q) return 100;
  if (name.startsWith(q)) return 90;
  if (brand.startsWith(q)) return 80;
  if (name.includes(q)) return 70;
  if (brand.includes(q)) return 60;
  if (category.includes(q)) return 50;
  return 0;
}

export function searchProducts(query: string): SearchProduct[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const q = trimmed.toLowerCase();
  const catalog = [...ALL_PRODUCTS, ...getExtensionSearchProducts()];
  return catalog.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (CATEGORY_LABELS[p.category]?.toLowerCase().includes(q) ?? false),
  ).sort((a, b) => scoreProduct(b, trimmed) - scoreProduct(a, trimmed));
}

export function fetchSuggestions(query: string): Suggestion[] {
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

  const catalog = [...ALL_PRODUCTS, ...getExtensionSearchProducts()];

  catalog.filter((p) => p.name.toLowerCase().includes(q))
    .sort((a, b) => scoreProduct(b, trimmed) - scoreProduct(a, trimmed))
    .slice(0, 4)
    .forEach((p) => {
      add({
        id: `product-${p.id}`,
        text: p.name,
        category: CATEGORY_LABELS[p.category] ?? p.category,
        type: 'product',
      });
    });

  BRAND_NAMES.filter((b) => b.toLowerCase().includes(q))
    .slice(0, 2)
    .forEach((brand) => {
      add({ id: `brand-${brand}`, text: brand, type: 'brand' });
    });

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
    case 'newest':
      return copy.sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
        return numB - numA;
      });
    case 'relevance':
    default:
      return copy;
  }
}

export function getCategoryLabel(categoryId: string): string {
  return CATEGORY_LABELS[categoryId] ?? categoryId;
}
