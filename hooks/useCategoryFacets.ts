import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchCategoryFacets } from '@services/categoryService';
import { useCategory } from '@hooks/useCategories';
import { isVisibleProductBrand } from '@utils/categoryDisplay';
import type { ApiCategoryFacets } from '@/types/api-catalog';
import type { CatalogCategory, Product } from '@/types/catalog';

export const CATEGORY_FACETS_QUERY_KEY = 'category-facets';
const FACETS_STALE_TIME = 1000 * 60 * 5;

export type CategoryRailKind = 'all' | 'subcategory' | 'brand' | 'productType';

/** One row in the left rail. Every field originates from the catalog API. */
export interface CategoryRailItem {
  key: string;
  kind: CategoryRailKind;
  /** Subcategory slug, brand name, or product type; empty for the "All" row. */
  value: string;
  label: string;
  imageUrl: string | null;
  /** Logos stay contained; product-pack photos fill the circle. */
  imageFit: 'contain' | 'cover';
  productCount: number;
  /** Set on the first entry of a group so the rail can draw a divider label. */
  sectionLabel?: string;
}

export interface CategoryRailSelection {
  kind: CategoryRailKind;
  value: string;
}

export const ALL_RAIL_SELECTION: CategoryRailSelection = {
  kind: 'all',
  value: '',
};

interface BrandAccumulator {
  value: string;
  label: string;
  productCount: number;
  logoUrl: string | null;
  productImageUrl: string | null;
}

function pickHttps(url?: string | null): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return null;
}

function brandKey(name: string): string {
  return name.trim().toLowerCase();
}

function collectBrands(products: Product[]): BrandAccumulator[] {
  const byKey = new Map<string, BrandAccumulator>();

  for (const product of products) {
    const label = product.brand?.trim();
    if (!isVisibleProductBrand(label)) continue;

    const key = brandKey(label!);
    const existing = byKey.get(key);
    const logoUrl = pickHttps(product.brandLogoUrl);
    const productImageUrl = pickHttps(product.imageUrl);

    if (!existing) {
      byKey.set(key, {
        value: label!,
        label: label!,
        productCount: 1,
        logoUrl,
        productImageUrl,
      });
      continue;
    }

    existing.productCount += 1;
    if (!existing.logoUrl && logoUrl) existing.logoUrl = logoUrl;
    if (!existing.productImageUrl && productImageUrl) {
      existing.productImageUrl = productImageUrl;
    }
  }

  return Array.from(byKey.values()).sort(
    (a, b) => b.productCount - a.productCount || a.label.localeCompare(b.label),
  );
}

function collectProductTypes(products: Product[]): CategoryRailItem[] {
  const byKey = new Map<string, CategoryRailItem>();

  for (const product of products) {
    const value = product.productType?.trim() || product.productTypeLabel?.trim();
    if (!value) continue;
    const label = product.productTypeLabel?.trim() || value;
    const key = value.toLowerCase();
    const imageUrl = pickHttps(product.imageUrl);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        key: `productType:${value}`,
        kind: 'productType',
        value,
        label,
        imageUrl,
        imageFit: 'cover',
        productCount: 1,
      });
      continue;
    }
    existing.productCount += 1;
    if (!existing.imageUrl && imageUrl) existing.imageUrl = imageUrl;
  }

  return Array.from(byKey.values()).sort(
    (a, b) => b.productCount - a.productCount || a.label.localeCompare(b.label),
  );
}

function subcategoryRail(category?: CatalogCategory | null): CategoryRailItem[] {
  return (category?.children ?? [])
    .filter((child) => (child.productCount ?? 0) > 0)
    .map((child) => ({
      key: `subcategory:${child.slug}`,
      kind: 'subcategory' as const,
      value: child.slug,
      label: child.name,
      imageUrl: pickHttps(child.imageUrl),
      imageFit: 'cover' as const,
      productCount: child.productCount ?? 0,
    }));
}

function brandRailFromProducts(products: Product[]): CategoryRailItem[] {
  return collectBrands(products).map((brand) => {
    const logoUrl = brand.logoUrl;
    const imageUrl = logoUrl ?? brand.productImageUrl;
    return {
      key: `brand:${brand.value}`,
      kind: 'brand' as const,
      value: brand.value,
      label: brand.label,
      imageUrl,
      imageFit: logoUrl ? ('contain' as const) : ('cover' as const),
      productCount: brand.productCount,
    };
  });
}

function enrichFacetBrands(
  facets: ApiCategoryFacets,
  products: Product[],
): CategoryRailItem[] {
  const fromProducts = collectBrands(products);
  const byKey = new Map(fromProducts.map((brand) => [brandKey(brand.value), brand]));

  return facets.brands.map((facet) => {
    const extra = byKey.get(brandKey(facet.value)) ?? byKey.get(brandKey(facet.label));
    const logoUrl = pickHttps(facet.imageUrl) ?? extra?.logoUrl ?? null;
    const imageUrl = logoUrl ?? extra?.productImageUrl ?? null;
    return {
      key: `brand:${facet.value}`,
      kind: 'brand' as const,
      value: facet.value,
      label: facet.label,
      imageUrl,
      imageFit: logoUrl ? ('contain' as const) : ('cover' as const),
      productCount: facet.productCount,
    };
  });
}

function applySectionLabels(items: CategoryRailItem[]): CategoryRailItem[] {
  const hasSubs = items.some((item) => item.kind === 'subcategory');
  const hasBrands = items.some((item) => item.kind === 'brand');
  const hasTypes = items.some((item) => item.kind === 'productType');
  const groupCount = Number(hasSubs) + Number(hasBrands) + Number(hasTypes);
  if (groupCount < 2) return items;

  const next = items.map((item) => ({ ...item, sectionLabel: undefined }));
  const firstSub = next.find((item) => item.kind === 'subcategory');
  const firstBrand = next.find((item) => item.kind === 'brand');
  const firstType = next.find((item) => item.kind === 'productType');
  if (firstSub) firstSub.sectionLabel = 'Types';
  if (firstBrand) firstBrand.sectionLabel = 'Brands';
  if (firstType && !firstSub) firstType.sectionLabel = 'Types';
  return next;
}

/**
 * Left-rail brands / types for a category screen.
 *
 * Prefers `GET /categories/:id/facets` when the backend has it. On production
 * backends that still 404, the rail is built from the live category + product
 * list already on screen — never from a hardcoded brand list.
 */
export function useCategoryFacets(
  categoryIdOrSlug?: string,
  products: Product[] = [],
  options?: { enabled?: boolean; totalProducts?: number },
) {
  const enabled = Boolean(categoryIdOrSlug) && options?.enabled !== false;

  const categoryQuery = useCategory(enabled ? categoryIdOrSlug : undefined);

  const facetsQuery = useQuery({
    queryKey: [CATEGORY_FACETS_QUERY_KEY, categoryIdOrSlug],
    queryFn: ({ signal }) => fetchCategoryFacets(categoryIdOrSlug!, signal),
    enabled,
    staleTime: FACETS_STALE_TIME,
    retry: false,
    refetchOnMount: 'always',
  });

  const facets = facetsQuery.data ?? undefined;
  const category = categoryQuery.data;

  const rail = useMemo<CategoryRailItem[]>(() => {
    if (!categoryIdOrSlug) return [];

    const allImage =
      pickHttps(facets?.category.imageUrl) ??
      pickHttps(category?.imageUrl) ??
      pickHttps(products[0]?.imageUrl);

    const subcategories =
      facets && facets.subcategories.length > 0
        ? facets.subcategories.map((facet) => ({
            key: `subcategory:${facet.value}`,
            kind: 'subcategory' as const,
            value: facet.value,
            label: facet.label,
            imageUrl: pickHttps(facet.imageUrl),
            imageFit: 'cover' as const,
            productCount: facet.productCount,
          }))
        : subcategoryRail(category);

    const brands =
      facets && facets.brands.length > 0
        ? enrichFacetBrands(facets, products)
        : brandRailFromProducts(products);

    const productTypes =
      brands.length === 0
        ? facets && facets.productTypes.length > 0
          ? facets.productTypes.map((facet) => ({
              key: `productType:${facet.value}`,
              kind: 'productType' as const,
              value: facet.value,
              label: facet.label,
              imageUrl: pickHttps(facet.imageUrl),
              imageFit: 'cover' as const,
              productCount: facet.productCount,
            }))
          : collectProductTypes(products)
        : [];

    const totalProducts =
      facets?.totalProducts ??
      options?.totalProducts ??
      category?.productCount ??
      products.length;

    return applySectionLabels([
      {
        key: 'all',
        kind: 'all',
        value: '',
        label: 'All',
        imageUrl: allImage,
        imageFit: allImage ? 'cover' : 'contain',
        productCount: totalProducts,
      },
      ...subcategories,
      ...brands,
      ...productTypes,
    ]);
  }, [
    category,
    categoryIdOrSlug,
    facets,
    options?.totalProducts,
    products,
  ]);

  const refresh = useCallback(async () => {
    await Promise.all([facetsQuery.refetch(), categoryQuery.refetch()]);
  }, [categoryQuery, facetsQuery]);

  return {
    facets,
    category,
    rail,
    isLoading:
      products.length === 0 &&
      categoryQuery.isLoading &&
      !category &&
      !facets,
    error: categoryQuery.error,
    refresh,
  };
}

export function matchesRailSelection(
  product: Product,
  selection: CategoryRailSelection,
): boolean {
  if (selection.kind === 'all' || !selection.value) return true;

  if (selection.kind === 'brand') {
    return product.brand?.trim().toLowerCase() === selection.value.toLowerCase();
  }

  if (selection.kind === 'subcategory') {
    const value = selection.value.toLowerCase();
    return (
      product.subcategorySlug?.toLowerCase() === value ||
      product.categorySlug?.toLowerCase() === value
    );
  }

  if (selection.kind === 'productType') {
    const value = selection.value.toLowerCase();
    return (
      product.productType?.toLowerCase() === value ||
      product.productTypeLabel?.trim().toLowerCase() === value
    );
  }

  return true;
}
