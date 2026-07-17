import { getProductById } from '@constants/catalogData';
import {
  getVariantById,
  productHasStructuredVariants,
} from '@constants/catalogVariantHelpers';
import type { OrderProduct } from '@/types/order';
import type { CartItem } from '@store/cartStore';
import { useCartStore } from '@store/cartStore';
import { productToCartItem, resolveCartProductId } from '@utils/cartHelpers';

export interface ReorderApplyResult {
  addedCount: number;
  unavailableCount: number;
  allUnavailable: boolean;
  message: string;
}

function findVariantIdForLabel(
  productId: string,
  variantLabel?: string,
): string | undefined {
  if (!variantLabel) return undefined;
  const product = getProductById(productId);
  if (!product || !productHasStructuredVariants(product)) return undefined;

  const variants = product.productVariants ?? [];
  const variant = variants.find(
    (v) =>
      v.label === variantLabel ||
      variantLabel.includes(v.label) ||
      v.label.includes(variantLabel),
  );
  return variant?.id;
}

export function orderProductToCartItem(product: OrderProduct): CartItem | null {
  const resolvedProductId = resolveCartProductId({
    id: product.id,
    productId: product.productId,
    name: product.name,
    description: product.variant ?? '',
    image: product.image ?? product.imageSearch ?? '',
    unitPrice: product.unitPrice,
    bulkPrice: product.unitPrice,
    bulkThreshold: 9999,
    quantity: product.quantity,
    unit: product.unit,
  });

  const catalogProduct = getProductById(resolvedProductId);
  if (!catalogProduct) return null;

  const variantId =
    product.id.includes('_') && product.id.startsWith(`${resolvedProductId}_`)
      ? product.id.slice(resolvedProductId.length + 1)
      : findVariantIdForLabel(resolvedProductId, product.variant);

  const cartItem = productToCartItem(catalogProduct, product.quantity, { variantId });

  if (product.id.includes('_')) {
    return { ...cartItem, id: product.id };
  }

  return cartItem;
}

export function buildReorderMessage(addedCount: number, unavailableCount: number): string {
  if (addedCount === 0) return 'No items could be added';
  if (unavailableCount === 0) return 'Items added to cart';
  const itemLabel = addedCount === 1 ? 'item' : 'items';
  const unavailableLabel = unavailableCount === 1 ? 'item' : 'items';
  return `${addedCount} ${itemLabel} added. ${unavailableCount} ${unavailableLabel} unavailable.`;
}

export function applyReorderToCart(products: OrderProduct[]): ReorderApplyResult {
  const addItem = useCartStore.getState().addItem;
  let addedCount = 0;
  let unavailableCount = 0;

  for (const product of products) {
    const cartItem = orderProductToCartItem(product);
    if (!cartItem) {
      unavailableCount += 1;
      continue;
    }
    addItem(cartItem);
    addedCount += 1;
  }

  const total = products.length;
  return {
    addedCount,
    unavailableCount,
    allUnavailable: total > 0 && addedCount === 0,
    message: buildReorderMessage(addedCount, unavailableCount),
  };
}

export function resolveReorderProducts(
  products: OrderProduct[] | undefined,
  orderProducts: OrderProduct[],
): OrderProduct[] {
  return products?.length ? products : orderProducts;
}
