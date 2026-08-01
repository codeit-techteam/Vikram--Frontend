import { create } from 'zustand';

import {
  getDefaultOrderQuantity,
  getMinOrderQuantity,
} from '@constants/catalogVariantHelpers';
import type { Product, ProductVariant } from '@/types/catalog';

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

export const useVariantStore = create<VariantSheetState>((set, get) => ({
  visible: false,
  product: null,
  selectedVariantId: null,
  quantity: 1,

  open: (product) =>
    set({
      visible: true,
      product,
      selectedVariantId: defaultVariantId(product),
      quantity: getDefaultOrderQuantity(product),
    }),

  close: () =>
    set({
      visible: false,
      product: null,
      selectedVariantId: null,
      quantity: 1,
    }),

  selectVariant: (variantId) => set({ selectedVariantId: variantId }),

  setQuantity: (qty) => {
    const { product } = get();
    const min = product ? getMinOrderQuantity(product) : 1;
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
