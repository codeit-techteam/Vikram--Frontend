import { api } from '@services/api';
import type { ApiResponse } from '@/types';

export interface CustomerOfferProduct {
  id: string;
  slug: string;
  name: string;
  quantity: number;
  imageUrl: string | null;
  retailPrice: number;
  price: number;
  available?: boolean;
  categoryName?: string | null;
  brand?: string | null;
}

export interface CustomerOffer {
  id: string;
  slug: string;
  title: string;
  titleHi?: string | null;
  description: string | null;
  bannerImage?: string | null;
  imageUrl: string | null;
  mobileImageUrl?: string | null;
  offerType: string;
  discountLabel: string | null;
  discountValue?: number | null;
  discountPercent?: number | null;
  bundlePrice?: number | null;
  originalPrice?: number | null;
  startingFrom?: number | null;
  badge: string | null;
  ctaLabel?: string | null;
  ctaAction?: string | null;
  ctaValue?: string | null;
  priority: number;
  isFeatured: boolean;
  startDate?: string | null;
  endDate?: string | null;
  productCount?: number;
  categories?: string[];
  products?: CustomerOfferProduct[];
}

export async function fetchOffers(params?: {
  featured?: boolean;
  limit?: number;
}): Promise<CustomerOffer[]> {
  const { data } = await api.get<ApiResponse<CustomerOffer[]>>('/offers', {
    params,
  });
  return data.data ?? [];
}

export async function fetchOfferBySlug(slug: string): Promise<CustomerOffer> {
  const { data } = await api.get<ApiResponse<CustomerOffer>>(`/offers/${slug}`);
  return data.data;
}

export const offerService = {
  fetchOffers,
  fetchOfferBySlug,
};
