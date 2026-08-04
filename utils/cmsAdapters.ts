import type { ImageSourcePropType } from 'react-native';
import type { VideoSource } from 'expo-video';
import { router, type Href } from 'expo-router';

import type { CmsBanner, CmsPromotion, CmsTestimonial } from '@/types/cms';
import {
  resolveCmsImageSource,
  resolveCmsVideoSource,
} from '@utils/cmsMedia';

export interface CmsHeroSlide {
  id: string;
  badge: string;
  title: string;
  shopNow: string;
  bulkInquiry: string;
  imageUrl: string;
  linkTarget: string | null;
  secondaryLinkTarget: string | null;
}

export interface CmsTestimonialVideoView {
  id: string;
  video: VideoSource;
  videoModule: number | null;
  thumbnail: ImageSourcePropType;
  customerName: string;
  location: string;
  rating: number;
  quote: string;
}

export interface CmsTestimonialReviewView {
  id: string;
  customerName: string;
  businessType: string;
  rating: number;
  review: string;
  photo?: ImageSourcePropType;
}

export function adaptHeroSlides(banners: CmsBanner[]): CmsHeroSlide[] {
  return banners
    .filter((b) => Boolean(b.imageUrl))
    .map((b) => ({
      id: b.id,
      badge: b.badge ?? '',
      title: b.title,
      shopNow: b.buttonText ?? '',
      bulkInquiry: b.secondaryButtonText ?? '',
      imageUrl: b.imageUrl,
      linkTarget: b.linkTarget ?? b.linkUrl,
      secondaryLinkTarget: b.secondaryLinkTarget ?? b.secondaryLinkUrl,
    }));
}

export function adaptTestimonialVideos(
  items: CmsTestimonial[],
): CmsTestimonialVideoView[] {
  return items
    .filter((t) => t.type === 'VIDEO' && t.videoUrl)
    .map((t) => {
      const video = resolveCmsVideoSource(t.videoUrl);
      return {
        id: t.id,
        video: video ?? { uri: t.videoUrl! },
        videoModule: typeof video === 'number' ? video : null,
        thumbnail: resolveCmsImageSource(t.thumbnailUrl),
        customerName: t.customerName,
        location: t.location ?? t.city ?? '',
        rating: t.rating,
        quote: t.review ?? '',
      };
    })
    .filter((t) => t.video != null);
}

export function adaptTestimonialReviews(
  items: CmsTestimonial[],
): CmsTestimonialReviewView[] {
  return items
    .filter((t) => t.type === 'TEXT' || t.type === 'IMAGE')
    .map((t) => ({
      id: t.id,
      customerName: t.customerName,
      businessType: t.designation ?? 'Customer',
      rating: t.rating,
      review: t.review ?? '',
      photo: t.profileImage || t.imageUrl
        ? resolveCmsImageSource(t.profileImage ?? t.imageUrl)
        : undefined,
    }));
}

export function navigateCmsRedirect(
  redirectType?: string | null,
  redirectId?: string | null,
): void {
  if (!redirectId) return;

  switch (redirectType) {
    case 'PRODUCT':
      router.push({
        pathname: '/products/detail/[productId]',
        params: { productId: redirectId, categoryId: '', categoryName: '' },
      } as Href);
      break;
    case 'CATEGORY':
      router.push({
        pathname: '/products/[categoryId]',
        params: { categoryId: redirectId, categoryName: redirectId },
      } as Href);
      break;
    case 'OFFER':
      router.push(`/offers/${redirectId}` as Href);
      break;
    case 'SEARCH':
      router.push({
        pathname: '/(tabs)/catalog',
        params: { q: redirectId },
      } as Href);
      break;
    case 'MEMBERSHIP':
      router.push((redirectId.startsWith('/') ? redirectId : '/membership') as Href);
      break;
    case 'BULK_INQUIRY':
      router.push(
        (redirectId.startsWith('/') ? redirectId : '/bulk-procurement') as Href,
      );
      break;
    case 'MATERIAL_EXPERT':
      router.push(
        (redirectId.startsWith('/') ? redirectId : '/material-expert') as Href,
      );
      break;
    case 'WHATSAPP':
    case 'EXTERNAL':
    case 'BRAND':
    case 'ROUTE':
      router.push(redirectId as Href);
      break;
    default:
      if (redirectId.startsWith('/') || redirectId.startsWith('http') || redirectId.startsWith('tel:')) {
        router.push(redirectId as Href);
      }
      break;
  }
}

export function navigatePromotion(promo: CmsPromotion | null | undefined): void {
  if (!promo) return;
  navigateCmsRedirect(promo.redirectType, promo.redirectId);
}

export function navigateBannerPrimary(banner: CmsBanner): void {
  navigateCmsRedirect(banner.linkType ?? banner.buttonAction, banner.linkTarget ?? banner.linkUrl);
}

export function navigateBannerSecondary(banner: CmsBanner): void {
  navigateCmsRedirect(
    banner.secondaryLinkType,
    banner.secondaryLinkTarget ?? banner.secondaryLinkUrl,
  );
}
