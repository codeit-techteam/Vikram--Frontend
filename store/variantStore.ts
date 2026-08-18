import { create } from 'zustand';

import { getDefaultOrderQuantity } from '@constants/catalogVariantHelpers';
import type { Product, ProductVariant } from '@/types/catalog';
import { useCartStore } from '@store/cartStore';

interface VariantSheetState {
  visible: boolean;
  product: Product | null;
  selectedVariantId: string | null;
  quantity: number;
  open: (product: Product) => void;
  close: () => void;
  selectVariant: (variantId: string) => void;
  setQuantity: (qty: number) => void;
  getSelectedVariant: () => ProductVariant | null;
}

function defaultVariantId(product: Product): string | null {
  const variants = product.productVariants ?? [];
  if (variants.length === 0) return null;
  const inStock = variants.find((v) => v.inStock !== false);
  return product.defaultVariantId ?? inStock?.id ?? variants[0]?.id ?? null;
}

function cartQuantityFor(product: Product, variantId: string | null): number {
  const items = useCartStore.getState().items;
  if (variantId) {
    const line = items.find(
      (i) =>
        (i.productId ?? i.id) === product.id && i.variantId === variantId,
    );
    if (line) return line.quantity;
  }
  return useCartStore.getState().getProductQuantity(product.id);
}

export const useVariantStore = create<VariantSheetState>((set, get) => ({
  visible: false,
  product: null,
  selectedVariantId: null,
  quantity: 1,

  open: (product) => {
    const selectedVariantId = defaultVariantId(product);
    const inCart = cartQuantityFor(product, selectedVariantId);
    set({
      visible: true,
      product,
      selectedVariantId,
      quantity: inCart > 0 ? inCart : getDefaultOrderQuantity(product),
    });
  },

  close: () =>
    set({
      visible: false,
      product: null,
      selectedVariantId: null,
      quantity: 1,
    }),

  selectVariant: (variantId) => {
    const { product } = get();
    const inCart = product ? cartQuantityFor(product, variantId) : 0;
    set({
      selectedVariantId: variantId,
      quantity: inCart > 0 ? inCart : get().quantity,
    });
  },

  setQuantity: (qty) => {
    const { product } = get();
    const min = 1;
    const max = product?.maxOrder;
    let next = Math.max(min, Math.floor(qty));
    if (typeof max === 'number') next = Math.min(max, next);
    set({ quantity: next });
  },

  getSelectedVariant: () => {
    const { product, selectedVariantId } = get();
    if (!product || !selectedVariantId) return null;
    return product.productVariants?.find((v) => v.id === selectedVariantId) ?? null;
  },
}));
