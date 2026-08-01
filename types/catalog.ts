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
  mrp?: number | null;
  discountPercent?: number;
  bulkPrice?: number | null;
  inStock?: boolean;
  stockLeft?: number | null;
}

export interface BulkPricingTier {
  minQty: number;
  price: number;
  label?: string | null;
}

export interface Product {
  id: string;
  slug?: string;
  sku?: string | null;
  badge: string;
  badgeColor?: string;
  image?: ImageSourcePropType;
  /** Remote URL when storage is configured; null → local placeholder */
  imageUrl?: string | null;
  brandLogoUrl?: string | null;
  imageSearch: string;
  category: string;
  categoryId?: string;
  categorySlug?: string;
  subcategoryId?: string | null;
  subcategorySlug?: string | null;
  subcategoryName?: string | null;
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
  variantCount?: number;
  /** When true, pack-size variant replaces quantity stepper (e.g. bricks) */
  variantIsQuantity?: boolean;
  perPiecePrice?: number;
  bulkPerPiecePrice?: number;
  retailPrice: string;
  retailPriceValue: number;
  mrp?: number | null;
  discountPercent?: number;
  salePrice?: number | null;
  bulkLabel: string;
  bulkPrice: string;
  bulkPriceValue: number;
  bulkPricing?: BulkPricingTier[];
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
  availableStock?: number | null;
  deliveryETA?: string | null;
  deliveryMessage?: string | null;
  estimatedDeliveryMinutes?: number | null;
  deliveryEligible?: boolean;
  gst?: number;
  rating?: number | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  isFeatured?: boolean;
  isBestSelling?: boolean;
  isNewArrival?: boolean;
  isAvailable?: boolean;
  specsMap?: Record<string, string> | null;
  carouselUrls?: string[];
  gallery?: string[];
  relatedProducts?: Product[];
  hubInventory?: Array<{
    hubId: string;
    hubName?: string | null;
    availableQty: number;
    variantId?: string | null;
  }>;
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
