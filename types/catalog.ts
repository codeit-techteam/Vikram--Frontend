import type { ImageSourcePropType } from 'react-native';

import type { StringKey } from '@constants/strings';

export interface CatalogCategory {
  id: string;
  labelKey: StringKey;
  image: ImageSourcePropType;
  imageSearch?: string;
}

export type ProductStatus = 'READY FOR DISPATCH' | 'IN STOCK' | 'LIMITED STOCK';

export type ProductCategoryType = 'cement' | 'steel' | 'sand' | 'bricks' | 'stone';

export interface Product {
  id: string;
  badge: string;
  badgeColor?: string;
  image?: ImageSourcePropType;
  imageSearch: string;
  category: string;
  name: string;
  nameHi?: string;
  grade: string;
  status: ProductStatus;
  spec: string;
  retailPrice: string;
  retailPriceValue: number;
  bulkLabel: string;
  bulkPrice: string;
  bulkPriceValue: number;
  unit: string;
  defaultQuantity: number;
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
