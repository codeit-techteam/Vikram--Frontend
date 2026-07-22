import type { ImageSourcePropType } from 'react-native';

import { resolveProductImageSource } from '@utils/catalogPlaceholders';
import { useCatalogStore } from '@store/catalogStore';
import {
  getAllProducts,
  getProductById,
  getProductImageSource,
  getProductImageUrl,
} from '@constants/catalogData';
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
}

/** Resolve catalog product id from cart line id (handles ids like `bricks_grey_flash_gb_500`). */
export function resolveCartProductId(item: CartItem): string {
  if (item.productId) return item.productId;
  if (!item.id.includes('_')) return item.id;

  const cached = Object.values(useCatalogStore.getState().productCache);
  const fromCache = cached
    .filter((p) => item.id === p.id || item.id.startsWith(`${p.id}_`))
    .sort((a, b) => b.id.length - a.id.length)[0];
  if (fromCache) return fromCache.id;

  const all = getAllProducts();
  const match = all
    .filter((p) => item.id === p.id || item.id.startsWith(`${p.id}_`))
    .sort((a, b) => b.id.length - a.id.length)[0];
  return match?.id ?? item.id;
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
  const cached = useCatalogStore.getState().getCachedProduct(productId);
  if (cached) return getProductImageSource(cached);

  const product = getProductById(productId);
  if (product) return getProductImageSource(product);

  const imageSearch = item.image ?? item.imageSearch;
  if (!imageSearch) return null;

  return resolveProductImageSource({
    imageUrl: imageSearch,
    productSlug: productId,
    categorySlug: item.category,
    fallbackImage:
      imageSearch.startsWith('http://') || imageSearch.startsWith('https://')
        ? { uri: imageSearch }
        : imageSearch.startsWith('/assets/')
          ? undefined
          : { uri: getProductImageUrl(imageSearch) },
  });
}

export function getCartItemLineTotal(item: CartItem): number {
  const price = item.quantity >= item.bulkThreshold ? item.bulkPrice : item.unitPrice;
  return item.quantity * price;
}
