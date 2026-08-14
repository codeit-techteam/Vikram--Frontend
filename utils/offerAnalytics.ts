export type OfferAnalyticsEvent =
  | 'offer_impression'
  | 'offer_click'
  | 'offer_cta_click'
  | 'offer_product_click';

export function trackOfferEvent(
  event: OfferAnalyticsEvent,
  payload: Record<string, unknown>,
): void {
  if (__DEV__) {
    console.log('[offer-analytics]', event, payload);
  }
}
