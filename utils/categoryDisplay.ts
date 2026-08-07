import type { CatalogCategory } from '@/types/catalog';
import type { StringKey } from '@constants/strings';

const HIDDEN_CATEGORY_SLUGS = new Set(['hardware']);

/** Categories hidden from customer marketplace grids (Home + Catalog). */
export function isMarketplaceCategory(cat: CatalogCategory): boolean {
  const slug = (cat.slug ?? '').toLowerCase().trim();
  const name = (cat.name ?? '').toLowerCase().trim();
  if (HIDDEN_CATEGORY_SLUGS.has(slug) || name === 'hardware') return false;
  return cat.isActive !== false;
}

/** Rename legacy labels for consistent marketplace display. */
export function normalizeCategoryDisplayName(name: string): string {
  const trimmed = name.trim();
  // "Bricks & Masonry" / "Bricks and Masonry" / typo variants → "Bricks"
  if (/^bricks\s*(&|and)\b/i.test(trimmed)) return 'Bricks';
  if (/^ईंट\s*(और|&)\b/u.test(trimmed)) return 'ईंट';
  return trimmed;
}

export function getCategoryDisplayName(
  cat: CatalogCategory,
  language: string,
  t?: (key: StringKey) => string,
): string {
  if (language === 'hi' && cat.nameHi) {
    return normalizeCategoryDisplayName(cat.nameHi);
  }
  if (cat.labelKey && t) {
    try {
      return normalizeCategoryDisplayName(t(cat.labelKey));
    } catch {
      // fall through
    }
  }
  return normalizeCategoryDisplayName(cat.name);
}

export function filterMarketplaceCategories(
  categories: CatalogCategory[],
): CatalogCategory[] {
  return categories.filter(isMarketplaceCategory);
}

/** Home grid order follows backend displayOrder (CMS / admin categories). */
export function sortHomeCategories(
  categories: CatalogCategory[],
): CatalogCategory[] {
  return [...categories].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
}

/** Hide generic/placeholder supplier labels on product cards. */
export function isVisibleProductBrand(brand?: string | null): boolean {
  if (!brand?.trim()) return false;
  const normalized = brand.trim().toLowerCase();
  if (normalized === 'regional supplier') return false;
  if (normalized === 'local supplier') return false;
  if (normalized === 'regional aggregates') return false;
  return true;
}
