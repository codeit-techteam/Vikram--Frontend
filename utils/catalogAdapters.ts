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
  BulkPricingTier,
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
    mrp: variant.mrp ?? null,
    discountPercent: variant.discountPercent,
    bulkPrice: variant.bulkPrice ?? null,
    inStock: variant.inStock,
    stockLeft: variant.stockLeft ?? null,
  };
}

function resolvePrimaryImageUrl(dto: ApiProduct): string | null {
  if (dto.thumbnail) return dto.thumbnail;
  const primary = dto.images?.find((img) => img.isPrimary) ?? dto.images?.[0];
  return primary?.url ?? primary?.imageUrl ?? null;
}

function adaptBulkPricing(dto: ApiProduct): BulkPricingTier[] {
  if (dto.bulkPricing?.length) {
    return dto.bulkPricing.map((t) => ({
      minQty: t.minQty,
      price: t.price,
      label: t.label,
    }));
  }
  if (dto.bulkPrice != null && dto.bulkThreshold > 0) {
    return [
      {
        minQty: dto.bulkThreshold,
        price: dto.bulkPrice,
        label: dto.bulkLabel ?? `Buy ${dto.bulkThreshold}+`,
      },
    ];
  }
  return [];
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
  const variantsSource = dto.variants ?? dto.variantList ?? [];
  const productVariants = variantsSource.map(adaptVariant);
  const bulkPricing = adaptBulkPricing(dto);
  const gallery =
    dto.gallery?.filter(Boolean) ??
    dto.images?.map((img) => img.url || img.imageUrl || '').filter(Boolean) ??
    [];
  const stockLeft = dto.availableStock ?? dto.stockLeft ?? null;
  const firstBulk = bulkPricing[0];

  const product: Product = {
    id: dto.id,
    slug: dto.slug,
    badge: dto.badge ?? '',
    badgeColor: dto.badgeColor ?? undefined,
    imageUrl,
    brandLogoUrl: dto.brandLogoUrl ?? null,
    image: resolveProductImageSource({
      imageUrl,
      productSlug: dto.slug,
      categorySlug,
    }),
    imageSearch: dto.slug || categorySlug || 'default',
    category: dto.categoryName || dto.category?.name || categorySlug,
    categoryId: dto.categoryId || dto.category?.id,
    categorySlug,
    subcategoryId: dto.subcategoryId,
    subcategorySlug: dto.subcategorySlug,
    subcategoryName: dto.subcategoryName,
    brand: dto.brand ?? undefined,
    sku: dto.sku ?? null,
    name: dto.name,
    nameHi: dto.nameHi ?? undefined,
    grade: dto.grade ?? '',
    status: normalizeStatus(dto.status),
    spec: dto.spec ?? '',
    hasVariants: dto.hasVariants || productVariants.length > 1,
    productVariants,
    defaultVariantId: dto.defaultVariantId ?? undefined,
    variantCount: dto.variantCount ?? productVariants.length,
    perPiecePrice: dto.perPiecePrice ?? undefined,
    retailPrice: `${formatINR(retail, false)} / ${dto.unit}`,
    retailPriceValue: retail,
    mrp: dto.mrp ?? null,
    discountPercent: dto.discountPercent,
    salePrice: null,
    bulkLabel:
      dto.bulkLabel ??
      firstBulk?.label ??
      (dto.bulkThreshold > 0 ? `Bulk Price (${dto.bulkThreshold}+)` : ''),
    bulkPrice: bulk > 0 ? `${formatINR(bulk, false)} / ${dto.unit}` : '',
    bulkPriceValue: bulk || firstBulk?.price || 0,
    bulkPricing,
    unit: dto.unit,
    // Default selected qty follows minOrder (else 1) — never invent 10/50/etc.
    minOrder: dto.minOrder ?? 1,
    defaultQuantity: Math.max(1, dto.minOrder ?? 1),
    maxOrder: dto.maxOrder ?? undefined,
    incrementStep: dto.incrementStep ?? 1,
    bulkThreshold: firstBulk?.minQty ?? dto.bulkThreshold ?? 0,
    description: dto.description ?? '',
    categoryType,
    detailName: dto.detailName ?? dto.name,
    stockLeft,
    availableStock: stockLeft,
    deliveryETA: dto.deliveryETA ?? null,
    deliveryMessage: dto.deliveryMessage ?? dto.deliveryETA ?? null,
    estimatedDeliveryMinutes: dto.estimatedDeliveryMinutes ?? null,
    deliveryEligible: dto.deliveryEligible ?? (stockLeft == null ? true : stockLeft > 0),
    gst: dto.gst,
    rating: dto.rating ?? dto.averageRating ?? null,
    averageRating: dto.averageRating ?? dto.rating ?? null,
    reviewCount: dto.reviewCount ?? null,
    isFeatured: dto.isFeatured,
    isBestSelling: dto.isBestSelling || dto.isBestseller,
    isNewArrival: dto.isNewArrival,
    isAvailable: (stockLeft ?? 1) > 0,
    specsMap: dto.specs ?? null,
    carouselUrls: gallery,
    gallery,
    hubInventory: dto.hubInventory,
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
