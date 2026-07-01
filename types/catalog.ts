import type { ImageSourcePropType } from 'react-native';

import type { StringKey } from '@constants/strings';

export interface CatalogCategory {
  id: string;
  labelKey: StringKey;
  image: ImageSourcePropType;
  imageSearch?: string;
}

export type ProductStatus = 'READY FOR DISPATCH' | 'IN STOCK' | 'LIMITED STOCK';

export type ProductCategoryType =
  | 'cement'
  | 'steel'
  | 'sand'
  | 'bricks'
  | 'stone'
  | 'aggregates'
  | 'adhesives'
  | 'wall-repair'
  | 'waterproofing'
  | 'quick-repair'
  | 'putty';

export interface ProductVariant {
  id: string;
  label: string;
  displayUnit?: string;
  size?: number;
  sizeUnit?: string;
  count?: number;
  quantity?: number;
  price: number;
  bulkPrice?: number | null;
  inStock?: boolean;
}

export interface Product {
  id: string;
  badge: string;
  badgeColor?: string;
  image?: ImageSourcePropType;
  imageSearch: string;
  category: string;
  brand?: string;
  name: string;
  nameHi?: string;
  grade: string;
  status: ProductStatus;
  spec: string;
  /** @deprecated Use productVariants for priced variants */
  variants?: string[];
  variantsPlaceholder?: string;
  hasVariants?: boolean;
  productVariants?: ProductVariant[];
  defaultVariantId?: string;
  /** When true, pack-size variant replaces quantity stepper (e.g. bricks) */
  variantIsQuantity?: boolean;
  perPiecePrice?: number;
  bulkPerPiecePrice?: number;
  retailPrice: string;
  retailPriceValue: number;
  bulkLabel: string;
  bulkPrice: string;
  bulkPriceValue: number;
  unit: string;
  defaultQuantity: number;
  minOrder?: number;
  maxOrder?: number;
  incrementStep?: number;
  bulkThreshold: number;
  description: string;
  descriptionHi?: string;
  categoryType: ProductCategoryType;
  detailName?: string;
}

export interface TechSpecItem {
  icon: string;
  label: string;
  value: string;
}

export interface FrequentlyBoughtItem {
  id: string;
  name: string;
  desc: string;
  price: string;
  priceValue: number;
  imageSearch: string;
  unit: string;
}
