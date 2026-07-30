export interface DeliveryMessageOptions {
  preorder?: boolean;
  deliveringBy?: string | null;
  serviceable?: boolean;
}

/** Customer-facing delivery copy — mirrors backend ETA rules. */
export function buildDeliveryMessage(
  etaMinutes: number,
  options: DeliveryMessageOptions = {},
): string {
  if (options.preorder) return 'Available Tomorrow';
  if (!options.serviceable && etaMinutes <= 0) {
    return 'Delivery unavailable at this location';
  }
  if (etaMinutes > 0 && etaMinutes <= 30) {
    return `Delivery in ${etaMinutes} mins`;
  }
  if (etaMinutes > 30 && etaMinutes <= 90) {
    return 'Delivery in about 1 hour';
  }
  if (etaMinutes > 90) {
    if (options.deliveringBy) return `Delivery by ${options.deliveringBy}`;
    return 'Delivery Today';
  }
  return 'Fast Delivery Available';
}

export function buildDeliverySubtitle(
  serviceable: boolean,
  options: { freeDelivery?: boolean } = {},
): string {
  if (!serviceable) return 'We are expanding to your area soon';
  if (options.freeDelivery) return 'Free delivery on eligible orders';
  return 'Fast delivery available to your location';
}

export function deliveryIcon(serviceable: boolean, etaMinutes?: number | null): string {
  if (!serviceable) return 'alert-circle-outline';
  if (etaMinutes != null && etaMinutes <= 30) return 'flash-outline';
  return 'bicycle-outline';
}
