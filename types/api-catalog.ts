/** Backend catalog API shapes (customer-facing `/api/v1`). */

export interface ApiCategory {
  id: string;
  slug: string;
  name: string;
  nameHi?: string | null;
  description?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  icon?: string | null;
  iconUrl?: string | null;
  labelKey?: string | null;
  displayOrder: number;
  isFeatured: boolean;
  isVisible: boolean;
  productCount?: number;
  children?: ApiCategory[];
}

export interface ApiProductImage {
  id: string;
  url: string;
  imageUrl?: string;
  altText?: string | null;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ApiProductVariant {
  id: string;
  label: string;
  displayUnit?: string | null;
  size?: number | null;
  sizeUnit?: string | null;
  price: number;
  bulkPrice?: number | null;
  inStock: boolean;
}

export interface ApiProductCategorySummary {
  id: string;
  slug: string;
  name: string;
}

export interface ApiProduct {
  id: string;
  slug: string;
  sku?: string | null;
  name: string;
  nameHi?: string | null;
  detailName?: string | null;
  brand?: string | null;
  description?: string | null;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  category?: ApiProductCategorySummary;
  grade?: string | null;
  badge?: string | null;
  badgeColor?: string | null;
  status: string;
  spec?: string | null;
  unit: string;
  retailPrice: number;
  price: number;
  gst: number;
  thumbnail?: string | null;
  bulkPrice?: number | null;
  bulkThreshold: number;
  bulkLabel?: string | null;
  minOrder: number;
  maxOrder?: number | null;
  hasVariants: boolean;
  defaultVariantId?: string | null;
  perPiecePrice?: number | null;
  isFeatured: boolean;
  isBestSelling: boolean;
  specs?: Record<string, string> | null;
  images?: ApiProductImage[];
  variants?: ApiProductVariant[];
  relatedProducts?: ApiProduct[];
  stockLeft?: number;
  deliveryETA?: string;
  membershipPrice?: number | null;
  isBulkAvailable?: boolean;
}

export interface ApiPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  query?: string;
}

export interface ApiProductList {
  items: ApiProduct[];
  meta: ApiPaginationMeta;
}

export interface ApiHomeAnnouncement {
  id: string;
  slug: string;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkTarget?: string | null;
}

export interface ApiHomeQuickStats {
  activeOffers: number;
  featuredProducts: number;
}

export interface ApiHomeResponse {
  banners: unknown[];
  featuredOffers: unknown[];
  featuredCategories: ApiCategory[];
  topCategories: ApiCategory[];
  featuredProducts: ApiProduct[];
  bestSellingProducts: ApiProduct[];
  recommendedProducts: ApiProduct[];
  videos: unknown[];
  announcements: ApiHomeAnnouncement[];
  quickStats: ApiHomeQuickStats;
  testimonials: unknown[];
  bulkBanner?: unknown[];
  emergencyBanner?: unknown[];
  membership?: unknown | null;
  loyalty?: unknown | null;
  lastOrders?: unknown[];
}

export interface ApiSearchProduct {
  id: string;
  slug: string;
  name: string;
  brand?: string | null;
  categorySlug: string;
  categoryName: string;
  price: number;
  retailPrice: number;
  thumbnail?: string | null;
  imageUrl?: string | null;
  badge?: string | null;
  unit: string;
}

export interface ApiSearchCategory {
  id: string;
  slug: string;
  name: string;
  image?: string | null;
}

export interface ApiSearchOffer {
  id: string;
  slug: string;
  title: string;
  discountLabel?: string | null;
  bannerImage?: string | null;
}

export interface ApiSearchResponse {
  products: ApiSearchProduct[];
  categories: ApiSearchCategory[];
  offers: ApiSearchOffer[];
  items?: ApiSearchProduct[];
  meta: ApiPaginationMeta;
}

export interface ApiSearchSuggestionItem {
  text: string;
  type: 'product' | 'category' | 'offer' | 'brand' | 'term';
  slug?: string;
  imageUrl?: string | null;
}

export interface ApiSearchSuggestions {
  popularSearches: string[];
  recentSearches: string[];
  matchingProducts: ApiSearchSuggestionItem[];
  matchingCategories: ApiSearchSuggestionItem[];
  matchingOffers: ApiSearchSuggestionItem[];
  popular?: string[];
  recent?: string[];
  matching?: ApiSearchSuggestionItem[];
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'retailPrice' | 'name' | 'sales' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  category?: string;
  search?: string;
  featured?: boolean;
  bestSelling?: boolean;
  listingType?: 'FEATURED' | 'BEST_SELLING' | 'NEW_ARRIVAL' | 'STANDARD';
  brand?: string;
  grade?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
}
