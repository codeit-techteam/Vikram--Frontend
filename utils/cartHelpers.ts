import type { ImageSourcePropType } from 'react-native';

import { resolveProductImageSource } from '@utils/catalogPlaceholders';
import { useCatalogStore } from '@store/catalogStore';
import { useProductStore } from '@store/productStore';
import {
  getProductSkuUnit,
  getVariantById,
  getVariantDisplayUnit,
  productHasStructuredVariants,
} from '@constants/catalogVariantHelpers';
import type { Product } from '@/types/catalog';
import type { FrequentlyBoughtItem } from '@/types/catalog';
import type { CartItem } from '@store/cartStore';

export interface CartItemOptions {
  variantId?: string;
  quantity?: number;
  hubId?: string;
  etaMinutes?: number;
}

/** Resolve catalog product id from cart line id (handles ids like `uuid_variantUuid`). */
export function resolveCartProductId(item: CartItem): string {
  if (item.productId) return item.productId;
  if (!item.id.includes('_')) return item.id;

  const fromProductStore = useProductStore.getState().getProduct(item.id.split('_')[0]);
  if (fromProductStore) return fromProductStore.id;

  const cached = Object.values(useCatalogStore.getState().productCache);
  const fromCache = cached
    .filter((p) => item.id === p.id || item.id.startsWith(`${p.id}_`))
    .sort((a, b) => b.id.length - a.id.length)[0];
  if (fromCache) return fromCache.id;

  return item.id.split('_')[0] ?? item.id;
}

export function productToCartItem(
  product: Product,
  quantity: number,
  options?: CartItemOptions,
): CartItem {
  const variantId = options?.variantId;
  const variant = variantId ? getVariantById(product, variantId) : undefined;
  const hasVariant = productHasStructuredVariants(product) && variant;

  const unitPrice = hasVariant ? variant.price : product.retailPriceValue;
  const bulkPrice = hasVariant
    ? (variant.bulkPrice ?? variant.price)
    : product.bulkPriceValue;
  const cartId = hasVariant ? `${product.id}_${variantId}` : product.id;
  const baseName = product.detailName ?? product.name;
  const displayName = hasVariant ? `${baseName} (${variant.label})` : baseName;
  const unit = hasVariant
    ? getVariantDisplayUnit(variant) || getProductSkuUnit(product)
    : product.unit;

  return {
    id: cartId,
    productId: product.id,
    name: displayName,
    productName: baseName,
    brand: product.brand,
    category: product.category,
    description: product.description,
    imageSearch: product.imageSearch,
    image: product.imageUrl ?? product.imageSearch,
    unitPrice,
    bulkPrice,
    bulkThreshold: product.bulkThreshold,
    quantity,
    unit,
    variantId: hasVariant ? variantId : undefined,
    variantLabel: hasVariant ? variant.label : undefined,
    hubId: options?.hubId,
    etaMinutes: options?.etaMinutes,
  };
}

export function frequentItemToCartItem(item: FrequentlyBoughtItem): CartItem {
  return {
    id: item.id,
    productId: item.id,
    name: item.name,
    productName: item.name,
    description: item.desc,
    imageSearch: item.imageSearch,
    image: item.imageSearch,
    unitPrice: item.priceValue,
    bulkPrice: item.priceValue,
    bulkThreshold: 9999,
    quantity: 1,
    unit: item.unit,
  };
}

/** Returns the same image source used in catalog/detail — never a random category fallback. */
export function getCartItemImageSource(item: CartItem): ImageSourcePropType | null {
  const productId = resolveCartProductId(item);
  const fromStore = useProductStore.getState().getProduct(productId);
  if (fromStore?.imageUrl || fromStore?.slug) {
    return resolveProductImageSource({
      imageUrl: fromStore.imageUrl ?? fromStore.imageSearch,
      productSlug: fromStore.slug,
      categorySlug: fromStore.categorySlug ?? normalizeCategorySlug(item.category),
      productName: fromStore.detailName ?? fromStore.name ?? item.productName ?? item.name,
    });
  }

  const cached = useCatalogStore.getState().getCachedProduct(productId);
  if (cached?.imageUrl || cached?.slug) {
    return resolveProductImageSource({
      imageUrl: cached.imageUrl ?? cached.imageSearch,
      productSlug: cached.slug,
      categorySlug: cached.categorySlug ?? normalizeCategorySlug(item.category),
      productName: cached.detailName ?? cached.name ?? item.productName ?? item.name,
    });
  }

  const imageRef = item.image ?? item.imageSearch;
  const usableImage =
    imageRef && !isPlaceholderImageLabel(imageRef) ? imageRef : null;

  return resolveProductImageSource({
    // Pass /assets/... paths through — not only remote http(s) URLs.
    imageUrl: usableImage,
    productSlug: looksLikeSlug(productId) ? productId : null,
    categorySlug: normalizeCategorySlug(item.category),
    productName: item.productName ?? item.name,
  });
}

function isPlaceholderImageLabel(value: string): boolean {
  const v = value.trim().toLowerCase();
  return (
    v === 'construction materials' ||
    v === 'product' ||
    v === 'placeholder' ||
    (!v.includes('/') && !v.includes('.') && !v.startsWith('http'))
  );
}

function looksLikeSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(value.trim());
}

function normalizeCategorySlug(category?: string | null): string | null {
  if (!category) return null;
  const raw = category.trim().toLowerCase();
  if (!raw) return null;
  // Display names → catalog slugs
  const aliases: Record<string, string> = {
    adhesives: 'adhesives',
    adhesive: 'adhesives',
    cement: 'cement',
    steel: 'steel',
    sand: 'sand',
    bricks: 'bricks',
    aggregates: 'aggregates',
    putty: 'putty',
    'wall repair': 'wall-repair',
    waterproofing: 'waterproofing',
    'quick repair': 'quick-repair',
  };
  if (aliases[raw]) return aliases[raw];
  return raw.replace(/\s+/g, '-').replace(/_/g, '-');
}

export function getCartItemLineTotal(item: CartItem): number {
  const price = item.quantity >= item.bulkThreshold ? item.bulkPrice : item.unitPrice;
  return item.quantity * price;
}
