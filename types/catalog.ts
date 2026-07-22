import type { ImageSourcePropType } from 'react-native';

import type { StringKey } from '@constants/strings';

export interface CatalogCategory {
  id: string;
  slug: string;
  name: string;
  nameHi?: string | null;
  description?: string | null;
  labelKey?: StringKey | null;
  image: ImageSourcePropType;
  imageUrl?: string | null;
  displayOrder: number;
  isFeatured: boolean;
  isActive: boolean;
  productCount: number;
  /** @deprecated Prefer slug/name from API */
  imageSearch?: string;
}

export type ProductStatus = 'READY FOR DISPATCH' | 'IN STOCK' | 'LIMITED STOCK' | string;

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
  | 'putty'
  | 'tiles'
  | 'paint'
  | 'hardware'
  | string;

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
  slug?: string;
  badge: string;
  badgeColor?: string;
  image?: ImageSourcePropType;
  /** Remote URL when storage is configured; null → local placeholder */
  imageUrl?: string | null;
  imageSearch: string;
  category: string;
  categoryId?: string;
  categorySlug?: string;
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
  salePrice?: number | null;
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
  stockLeft?: number | null;
  deliveryETA?: string | null;
  gst?: number;
  rating?: number | null;
  isFeatured?: boolean;
  isBestSelling?: boolean;
  isAvailable?: boolean;
  specsMap?: Record<string, string> | null;
  carouselUrls?: string[];
  relatedProducts?: Product[];
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
