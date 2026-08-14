export type DeliveryPromotionAnalyticsEvent =
  | 'delivery_promotion_impression'
  | 'delivery_promotion_click'
  | 'delivery_promotion_cta_click';

export function trackDeliveryPromotionEvent(
  event: DeliveryPromotionAnalyticsEvent,
  payload: Record<string, unknown>,
): void {
  if (__DEV__) {
    console.log('[delivery-promotion-analytics]', event, payload);
  }
}
