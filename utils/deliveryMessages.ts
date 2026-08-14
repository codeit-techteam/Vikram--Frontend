export interface DeliveryMessageOptions {
  preorder?: boolean;
  deliveringBy?: string | null;
  serviceable?: boolean;
  etaMinMinutes?: number;
  etaMaxMinutes?: number;
}

/** Customer-facing delivery copy — mirrors backend ETA engine ranges. */
export function buildDeliveryMessage(
  etaMinutes: number,
  options: DeliveryMessageOptions = {},
): string {
  if (options.preorder) return 'Available Tomorrow';
  if (!options.serviceable && etaMinutes <= 0) {
    return 'Delivery unavailable at this location';
  }
  if (
    options.etaMinMinutes != null &&
    options.etaMaxMinutes != null &&
    options.etaMinMinutes > 0
  ) {
    const min = options.etaMinMinutes;
    const max = options.etaMaxMinutes;
    if (max < 60) {
      return min === max
        ? `Estimated delivery ~${min} mins`
        : `Estimated delivery ${min}–${max} mins`;
    }
    const minH = Math.round((min / 60) * 10) / 10;
    const maxH = Math.round((max / 60) * 10) / 10;
    return minH === maxH
      ? `Estimated delivery ~${minH} hrs`
      : `Estimated delivery ${minH}–${maxH} hrs`;
  }
  if (etaMinutes > 0) {
    return `Estimated delivery ~${etaMinutes} mins`;
  }
  if (!options.serviceable) {
    return 'Delivery unavailable at this location';
  }
  return 'Select delivery location to calculate ETA';
}

export function buildDeliverySubtitle(
  serviceable: boolean,
  options: { freeDelivery?: boolean } = {},
): string {
  if (!serviceable) return 'We are expanding to your area soon';
  if (options.freeDelivery) return 'Free delivery on eligible orders';
  return 'Delivery available to your location';
}

export function deliveryIcon(serviceable: boolean, etaMinutes?: number | null): string {
  if (!serviceable) return 'alert-circle-outline';
  if (etaMinutes != null && etaMinutes <= 30) return 'flash-outline';
  return 'bicycle-outline';
}
