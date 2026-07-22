import { formatINR } from '@utils/formatCurrency';
import {
  resolveCategoryImageSource,
  resolveProductImageSource,
} from '@utils/catalogPlaceholders';
import type {
  ApiCategory,
  ApiProduct,
  ApiProductVariant,
  ApiSearchProduct,
} from '@/types/api-catalog';
import type {
  CatalogCategory,
  Product,
  ProductCategoryType,
  ProductStatus,
  ProductVariant,
  TechSpecItem,
} from '@/types/catalog';
import type { SearchProduct } from '@constants/searchData';

const SPEC_ICONS = [
  'cube-outline',
  'speedometer-outline',
  'water-outline',
  'shield-checkmark-outline',
  'resize-outline',
  'layers-outline',
];

export function mapCategorySlugToType(slug: string): ProductCategoryType {
  const normalized = slug.toLowerCase();
  const aliases: Record<string, ProductCategoryType> = {
    cement: 'cement',
    steel: 'steel',
    hardware: 'hardware',
    sand: 'sand',
    bricks: 'bricks',
    'stone-chips': 'stone',
    stone: 'stone',
    aggregates: 'aggregates',
    adhesives: 'adhesives',
    'wall-repair': 'wall-repair',
    waterproofing: 'waterproofing',
    'quick-repair': 'quick-repair',
    putty: 'putty',
    tiles: 'tiles',
    paint: 'paint',
    'grey-fill-sand': 'sand',
  };
  return aliases[normalized] ?? normalized;
}

function normalizeStatus(status?: string | null): ProductStatus {
  if (!status) return 'IN STOCK';
  const upper = status.toUpperCase();
  if (upper.includes('LIMITED')) return 'LIMITED STOCK';
  if (upper.includes('READY') || upper.includes('DISPATCH')) return 'READY FOR DISPATCH';
  if (upper.includes('OUT') || upper.includes('UNAVAILABLE')) return 'LIMITED STOCK';
  return upper as ProductStatus;
}

function adaptVariant(variant: ApiProductVariant): ProductVariant {
  return {
    id: variant.id,
    label: variant.label,
    displayUnit: variant.displayUnit ?? undefined,
    size: variant.size ?? undefined,
    sizeUnit: variant.sizeUnit ?? undefined,
    price: variant.price,
    bulkPrice: variant.bulkPrice ?? null,
    inStock: variant.inStock,
  };
}

function resolvePrimaryImageUrl(dto: ApiProduct): string | null {
  if (dto.thumbnail) return dto.thumbnail;
  const primary = dto.images?.find((img) => img.isPrimary) ?? dto.images?.[0];
  return primary?.url ?? primary?.imageUrl ?? null;
}

export function adaptApiCategory(dto: ApiCategory): CatalogCategory {
  const imageUrl = dto.imageUrl ?? dto.image ?? null;
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    nameHi: dto.nameHi,
    description: dto.description,
    labelKey: (dto.labelKey as CatalogCategory['labelKey']) ?? null,
    image: resolveCategoryImageSource(dto.slug, imageUrl),
    imageUrl,
    displayOrder: dto.displayOrder,
    isFeatured: dto.isFeatured,
    isActive: dto.isVisible,
    productCount: dto.productCount ?? 0,
  };
}

export function adaptApiProduct(dto: ApiProduct): Product {
  const retail = dto.retailPrice ?? dto.price ?? 0;
  const bulk = dto.bulkPrice ?? 0;
  const imageUrl = resolvePrimaryImageUrl(dto);
  const categorySlug = dto.categorySlug || dto.category?.slug || '';
  const categoryType = mapCategorySlugToType(categorySlug);
  const carouselUrls =
    dto.images
      ?.map((img) => img.url || img.imageUrl || '')
      .filter(Boolean) ?? [];

  const product: Product = {
    id: dto.id,
    slug: dto.slug,
    badge: dto.badge ?? '',
    badgeColor: dto.badgeColor ?? undefined,
    imageUrl,
    image: resolveProductImageSource({
      imageUrl,
      productSlug: dto.slug,
      categorySlug,
    }),
    imageSearch: dto.slug || categorySlug || 'default',
    category: dto.categoryName || dto.category?.name || categorySlug,
    categoryId: dto.categoryId || dto.category?.id,
    categorySlug,
    brand: dto.brand ?? undefined,
    name: dto.name,
    nameHi: dto.nameHi ?? undefined,
    grade: dto.grade ?? '',
    status: normalizeStatus(dto.status),
    spec: dto.spec ?? '',
    hasVariants: dto.hasVariants,
    productVariants: dto.variants?.map(adaptVariant),
    defaultVariantId: dto.defaultVariantId ?? undefined,
    perPiecePrice: dto.perPiecePrice ?? undefined,
    retailPrice: `${formatINR(retail, false)} / ${dto.unit}`,
    retailPriceValue: retail,
    salePrice: null,
    bulkLabel: dto.bulkLabel ?? (dto.bulkThreshold > 0 ? `Bulk Price (${dto.bulkThreshold}+)` : ''),
    bulkPrice: bulk > 0 ? `${formatINR(bulk, false)} / ${dto.unit}` : '',
    bulkPriceValue: bulk,
    unit: dto.unit,
    defaultQuantity: Math.max(1, dto.minOrder ?? 1),
    minOrder: dto.minOrder ?? 1,
    maxOrder: dto.maxOrder ?? undefined,
    bulkThreshold: dto.bulkThreshold ?? 0,
    description: dto.description ?? '',
    categoryType,
    detailName: dto.detailName ?? dto.name,
    stockLeft: dto.stockLeft ?? null,
    deliveryETA: dto.deliveryETA ?? null,
    gst: dto.gst,
    isFeatured: dto.isFeatured,
    isBestSelling: dto.isBestSelling,
    isAvailable: (dto.stockLeft ?? 1) > 0,
    specsMap: dto.specs ?? null,
    carouselUrls,
    relatedProducts: dto.relatedProducts?.map((p) => adaptApiProduct(p)),
  };

  return product;
}

export function adaptApiSearchProduct(dto: ApiSearchProduct): SearchProduct {
  return {
    id: dto.slug || dto.id,
    category: mapCategorySlugToType(dto.categorySlug) as SearchProduct['category'],
    badge: null,
    name: dto.name,
    brand: dto.brand ?? '',
    price: dto.price ?? dto.retailPrice,
    unit: dto.unit,
    image: dto.imageUrl ?? dto.thumbnail ?? dto.categorySlug,
    slug: dto.slug,
    productId: dto.id,
    categorySlug: dto.categorySlug,
    categoryName: dto.categoryName,
    imageUrl: dto.imageUrl ?? dto.thumbnail ?? null,
  };
}

export function specsMapToTechItems(
  specs?: Record<string, string> | null,
): TechSpecItem[] {
  if (!specs) return [];
  return Object.entries(specs).map(([label, value], index) => ({
    icon: SPEC_ICONS[index % SPEC_ICONS.length],
    label,
    value,
  }));
}

export function productToSearchProduct(product: Product): SearchProduct {
  return {
    id: product.slug || product.id,
    category: product.categoryType as SearchProduct['category'],
    badge: product.isBestSelling ? 'TRENDING' : product.isFeatured ? 'POPULAR' : null,
    badgeColor: product.badgeColor,
    name: product.detailName ?? product.name,
    brand: product.brand ?? '',
    price: product.retailPriceValue,
    unit: product.unit,
    image: product.imageUrl ?? product.categorySlug ?? product.imageSearch,
    slug: product.slug,
    productId: product.id,
    categorySlug: product.categorySlug,
    categoryName: product.category,
    imageUrl: product.imageUrl ?? null,
  };
}
