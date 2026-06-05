import type { ImageSourcePropType } from 'react-native';

export interface CatalogCategory {
  id: string;
  name: string;
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
