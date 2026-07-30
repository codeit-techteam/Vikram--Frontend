import { create } from 'zustand';

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
      quantity: Math.max(1, product.defaultQuantity || product.minOrder || 1),
    }),

  close: () =>
    set({
      visible: false,
      product: null,
      selectedVariantId: null,
      quantity: 1,
    }),

  selectVariant: (variantId) => set({ selectedVariantId: variantId }),

  setQuantity: (qty) => set({ quantity: Math.max(1, qty) }),

  getSelectedVariant: () => {
    const { product, selectedVariantId } = get();
    if (!product || !selectedVariantId) return null;
    return product.productVariants?.find((v) => v.id === selectedVariantId) ?? null;
  },
}));
