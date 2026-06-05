import { getProductById, getProductImageUrl } from '@constants/catalogData';
import type { Product } from '@/types/catalog';
import type { FrequentlyBoughtItem } from '@/types/catalog';
import type { CartItem } from '@store/cartStore';

export function productToCartItem(product: Product, quantity: number): CartItem {
  return {
    id: product.id,
    name: product.detailName ?? product.name,
    description: product.description,
    image: getProductImageUrl(product.imageSearch),
    unitPrice: product.retailPriceValue,
    bulkPrice: product.bulkPriceValue,
    bulkThreshold: product.bulkThreshold,
    quantity,
    unit: product.unit,
  };
}

export function frequentItemToCartItem(item: FrequentlyBoughtItem): CartItem {
  return {
    id: item.id,
    name: item.name,
    description: item.desc,
    image: getProductImageUrl(item.imageSearch),
    unitPrice: item.priceValue,
    bulkPrice: item.priceValue,
    bulkThreshold: 9999,
    quantity: 1,
    unit: item.unit,
  };
}

export function getCartItemImageSource(item: CartItem) {
  const product = getProductById(item.id);
  if (product?.image) return product.image;
  return { uri: item.image };
}
