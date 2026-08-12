import type { ImageSourcePropType } from 'react-native';
import type { VideoSource } from 'expo-video';
import { router, type Href } from 'expo-router';

import type { CmsBanner, CmsCategory, CmsPromotion, CmsTestimonial } from '@/types/cms';
import type { CatalogCategory } from '@/types/catalog';
import {
  resolveCmsImageSource,
  resolveCmsVideoSource,
  extractVideoUri,
} from '@utils/cmsMedia';
import { resolveCategoryImageSource } from '@utils/catalogPlaceholders';
import { normalizeMediaUrl } from '@utils/media';

export interface CmsHeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  shopNow: string;
  bulkInquiry: string;
  imageUrl: string;
  linkType: string | null;
  linkTarget: string | null;
  secondaryLinkType: string | null;
  secondaryLinkTarget: string | null;
}

export interface CmsTestimonialVideoView {
  id: string;
  video: VideoSource;
  /** Remote HTTPS URI when available — used to generate matching frame thumbnails. */
  videoUri: string | null;
  videoModule: number | null;
  thumbnail: ImageSourcePropType | null;
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
      subtitle: b.subtitle ?? '',
      shopNow: b.buttonText ?? '',
      bulkInquiry: b.secondaryButtonText ?? '',
      imageUrl: b.imageUrl,
      linkType: b.linkType ?? b.buttonAction ?? 'ROUTE',
      linkTarget: b.linkTarget ?? b.linkUrl,
      secondaryLinkType: b.secondaryLinkType ?? 'ROUTE',
      secondaryLinkTarget: b.secondaryLinkTarget ?? b.secondaryLinkUrl,
    }));
}

export function adaptCmsCategories(categories: CmsCategory[]): CatalogCategory[] {
  return [...categories]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((c) => {
      const imageUrl = normalizeMediaUrl(c.imageUrl ?? c.iconUrl);
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        nameHi: c.nameHi,
        description: c.description,
        image: resolveCategoryImageSource(c.slug, imageUrl),
        imageUrl,
        displayOrder: c.displayOrder,
        isFeatured: c.isFeatured,
        isActive: true,
        productCount: 0,
      };
    });
}

export function adaptTestimonialVideos(
  items: CmsTestimonial[],
): CmsTestimonialVideoView[] {
  const result: CmsTestimonialVideoView[] = [];

  for (const t of items) {
    if (t.type !== 'VIDEO' || !t.videoUrl) continue;
    const video = resolveCmsVideoSource(t.videoUrl);
    if (!video) {
      if (__DEV__) {
        console.warn(
          `[cms] Testimonial ${t.id} (${t.customerName}) has unavailable video media`,
          t.videoUrl,
        );
      }
      continue;
    }
    result.push({
      id: t.id,
      video,
      videoUri: extractVideoUri(video),
      videoModule: typeof video === 'number' ? video : null,
      // Preview is always generated from the video file — ignore CMS thumbnail URLs.
      thumbnail: null,
      customerName: t.customerName,
      location: t.location ?? t.city ?? '',
      rating: t.rating,
      quote: t.review ?? '',
    });
  }

  return result;
}

export function adaptTestimonialReviews(
  items: CmsTestimonial[],
): CmsTestimonialReviewView[] {
  return items
    .filter((t) => t.type === 'TEXT' || t.type === 'IMAGE')
    .map((t) => {
      const photoSource = t.profileImage || t.imageUrl;
      if (t.type === 'IMAGE' && !photoSource && __DEV__) {
        console.warn(
          `[cms] Testimonial ${t.id} (${t.customerName}) has unavailable image media`,
        );
      }
      return {
        id: t.id,
        customerName: t.customerName,
        businessType: t.designation ?? 'Customer',
        rating: t.rating,
        review: t.review ?? '',
        photo: photoSource
          ? resolveCmsImageSource(photoSource) ?? undefined
          : undefined,
      };
    });
}

export function navigateCmsRedirect(
  redirectType?: string | null,
  redirectId?: string | null,
): void {
  if (!redirectId) return;

  const type = (redirectType || 'ROUTE').toUpperCase();
  let target = redirectId.trim();

  // Heal legacy mistaken nested catalog paths: /(tabs)/catalog/adhesives
  const nestedCatalog = target.match(/^\/\(tabs\)\/catalog\/([^/?#]+)/);
  if (nestedCatalog?.[1] && type === 'ROUTE') {
    router.push({
      pathname: '/products/[categoryId]',
      params: {
        categoryId: nestedCatalog[1],
        categorySlug: nestedCatalog[1],
        categoryName: nestedCatalog[1],
      },
    } as Href);
    return;
  }

  switch (type) {
    case 'PRODUCT':
      router.push({
        pathname: '/products/detail/[productId]',
        params: { productId: target, categoryId: '', categoryName: '' },
      } as Href);
      break;
    case 'CATEGORY':
      router.push({
        pathname: '/products/[categoryId]',
        params: {
          categoryId: target,
          categorySlug: target,
          categoryName: target,
        },
      } as Href);
      break;
    case 'OFFER':
      router.push(`/offers/${target}` as Href);
      break;
    case 'SEARCH':
      router.push({
        pathname: '/(tabs)/catalog',
        params: { q: target },
      } as Href);
      break;
    case 'MEMBERSHIP':
      router.push((target.startsWith('/') ? target : '/membership') as Href);
      break;
    case 'BULK_INQUIRY':
      router.push(
        (target.startsWith('/') ? target : '/bulk-procurement') as Href,
      );
      break;
    case 'MATERIAL_EXPERT':
      router.push(
        (target.startsWith('/') ? target : '/material-expert') as Href,
      );
      break;
    case 'WHATSAPP':
    case 'EXTERNAL':
    case 'BRAND':
    case 'ROUTE':
      router.push(target as Href);
      break;
    default:
      if (
        target.startsWith('/') ||
        target.startsWith('http') ||
        target.startsWith('tel:')
      ) {
        router.push(target as Href);
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
