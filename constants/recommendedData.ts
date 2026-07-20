import { getAllProducts } from '@constants/catalogData';
import type { Product } from '@/types/catalog';

export type RecommendationReason =
  | 'previously_ordered'
  | 'popular_near_you'
  | 'frequently_bought';

export type ImageBadgeType =
  | 'eta'
  | 'bulk_price'
  | 'best_seller'
  | 'new_arrival'
  | 'limited_stock';

export interface RecommendedProductMeta {
  productId: string;
  brand: string;
  rating: number;
  reviewCount: number;
  reason: RecommendationReason;
  imageBadges: ImageBadgeType[];
}

export interface RecommendedProduct extends Product {
  meta: RecommendedProductMeta;
}

const META_BY_ID: Record<string, RecommendedProductMeta> = {
  c1: {
    productId: 'c1',
    brand: 'UltraTech',
    rating: 4.8,
    reviewCount: 240,
    reason: 'previously_ordered',
    imageBadges: ['eta', 'best_seller'],
  },
  c2: {
    productId: 'c2',
    brand: 'ACC',
    rating: 4.6,
    reviewCount: 128,
    reason: 'popular_near_you',
    imageBadges: ['bulk_price', 'new_arrival'],
  },
  s1: {
    productId: 's1',
    brand: 'TATA Tiscon',
    rating: 4.9,
    reviewCount: 312,
    reason: 'frequently_bought',
    imageBadges: ['eta', 'best_seller'],
  },
  s2: {
    productId: 's2',
    brand: 'JSW',
    rating: 4.7,
    reviewCount: 186,
    reason: 'previously_ordered',
    imageBadges: ['eta', 'limited_stock'],
  },
  bricks_red: {
    productId: 'bricks_red',
    brand: 'Regional',
    rating: 4.5,
    reviewCount: 94,
    reason: 'popular_near_you',
    imageBadges: ['bulk_price', 'best_seller'],
  },
  sand_river: {
    productId: 'sand_river',
    brand: 'Premium',
    rating: 4.4,
    reviewCount: 67,
    reason: 'frequently_bought',
    imageBadges: ['eta', 'new_arrival'],
  },
};

const FALLBACK_REASONS: RecommendationReason[] = [
  'previously_ordered',
  'popular_near_you',
  'frequently_bought',
];

function inferBrand(product: Product): string {
  if (product.brand) return product.brand;
  const first = product.name.split(' ')[0];
  return first ?? product.category;
}

function inferBadges(product: Product): ImageBadgeType[] {
  const badges: ImageBadgeType[] = [];
  if (product.badge?.includes('90')) badges.push('eta');
  if (product.badge?.toLowerCase().includes('bulk')) badges.push('bulk_price');
  if (product.status === 'LIMITED STOCK') badges.push('limited_stock');
  if (badges.length === 0) badges.push('best_seller');
  return badges;
}

function enrichProduct(product: Product, index: number): RecommendedProduct {
  const preset = META_BY_ID[product.id];
  if (preset) {
    return { ...product, meta: preset };
  }

  return {
    ...product,
    meta: {
      productId: product.id,
      brand: inferBrand(product),
      rating: 4.3 + (index % 5) * 0.1,
      reviewCount: 50 + index * 37,
      reason: FALLBACK_REASONS[index % FALLBACK_REASONS.length],
      imageBadges: inferBadges(product),
    },
  };
}

/** Curated home recommendations with mock personalization metadata. */
export function getRecommendedProducts(limit = 6): RecommendedProduct[] {
  const preferredIds = ['c1', 's2', 'bricks_red', 'sand_river', 's1', 'c2'];
  const all = getAllProducts();
  const byId = new Map(all.map((p) => [p.id, p]));

  const ordered = preferredIds
    .map((id) => byId.get(id))
    .filter((p): p is Product => Boolean(p));

  const remainder = all.filter((p) => !preferredIds.includes(p.id));
  const combined = [...ordered, ...remainder].slice(0, limit);

  return combined.map(enrichProduct);
}

export const IMAGE_BADGE_LABELS: Record<ImageBadgeType, string> = {
  eta: '90 MIN ETA',
  bulk_price: 'Bulk Price',
  best_seller: 'Best Seller',
  new_arrival: 'New Arrival',
  limited_stock: 'Limited Stock',
};

export const IMAGE_BADGE_COLORS: Record<ImageBadgeType, { bg: string; text: string }> = {
  eta: { bg: '#1A1A1A', text: '#FFFFFF' },
  bulk_price: { bg: '#FFF3CD', text: '#8B6914' },
  best_seller: { bg: '#FEB623', text: '#1A1A1A' },
  new_arrival: { bg: '#E8F5E9', text: '#2E7D32' },
  limited_stock: { bg: '#FFEBEE', text: '#C62828' },
};
