import { router, type Href } from 'expo-router';

import type { CustomerOffer } from '@services/offer.api';
import type { CmsOffer } from '@/types/cms';
import { trackOfferEvent } from '@utils/offerAnalytics';

export function resolveOfferCtaAction(
  offer: Pick<CustomerOffer | CmsOffer, 'ctaAction' | 'ctaLabel'> & {
    products?: Array<{ slug?: string; id?: string }>;
  },
): 'OFFER_DETAILS' | 'PRODUCTS' | 'BUY_NOW' | 'VIEW_DETAILS' {
  const action = (offer.ctaAction || '').toUpperCase();
  if (
    action === 'OFFER_DETAILS' ||
    action === 'PRODUCTS' ||
    action === 'BUY_NOW' ||
    action === 'VIEW_DETAILS'
  ) {
    return action;
  }
  const label = (offer.ctaLabel || '').trim().toLowerCase();
  if (label === 'buy now') return 'BUY_NOW';
  if (label === 'view products') return 'PRODUCTS';
  return 'OFFER_DETAILS';
}

export function navigateToOffer(
  offer: Pick<CustomerOffer | CmsOffer, 'slug' | 'ctaAction' | 'ctaLabel' | 'id'> & {
    products?: Array<{ slug?: string; id?: string }>;
  },
  source: 'card' | 'cta' | 'see_all' = 'card',
): void {
  if (source === 'cta') {
    trackOfferEvent('offer_cta_click', { id: offer.id, slug: offer.slug });
  } else {
    trackOfferEvent('offer_click', { id: offer.id, slug: offer.slug, source });
  }

  const action = resolveOfferCtaAction(offer);
  if (action === 'BUY_NOW') {
    const first = offer.products?.[0];
    const productId = first?.slug || first?.id;
    if (productId) {
      router.push(`/products/detail/${productId}` as Href);
      return;
    }
  }

  router.push(`/offers/${offer.slug}` as Href);
}
