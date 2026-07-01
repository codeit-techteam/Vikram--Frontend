import type { ImageSourcePropType } from 'react-native';

import { getAllProducts, getProductById, getProductImageSource, getProductImageUrl } from '@constants/catalogData';
import {
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
  const unit = hasVariant ? getVariantDisplayUnit(variant) || variant.label : product.unit;

  return {
    id: cartId,
    productId: product.id,
    name: displayName,
    productName: baseName,
    brand: product.brand,
    category: product.category,
    description: product.description,
    imageSearch: product.imageSearch,
    image: product.imageSearch,
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
  const product = getProductById(productId);
  if (product) return getProductImageSource(product);

  const imageSearch = item.imageSearch ?? item.image;
  if (!imageSearch) return null;
  if (imageSearch.startsWith('http://') || imageSearch.startsWith('https://')) {
    return { uri: imageSearch };
  }

  return { uri: getProductImageUrl(imageSearch) };
}

export function getCartItemLineTotal(item: CartItem): number {
  const price = item.quantity >= item.bulkThreshold ? item.bulkPrice : item.unitPrice;
  return item.quantity * price;
}
