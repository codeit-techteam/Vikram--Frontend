/**
 * BajriPro Points pricing helpers — mirrors backend loyalty.constants.ts.
 * Cart may preview with these; checkout/order always recalculate on the server.
 */

export const BAJRIPRO_POINT_VALUE_INR = 0.01;
export const BAJRIPRO_MIN_REDEEM_ORDER_VALUE = 500;
export const BAJRIPRO_MAX_ORDER_REDEEM_PERCENT = 0.3;
export const BAJRIPRO_EARN_POINTS_PER_100_INR = 1;

export function toMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function pointsToDiscountAmount(
  points: number,
  pointValueInr = BAJRIPRO_POINT_VALUE_INR,
): number {
  return toMoney(Math.max(0, points) * pointValueInr);
}

export function discountAmountToPoints(
  amountInr: number,
  pointValueInr = BAJRIPRO_POINT_VALUE_INR,
): number {
  if (amountInr <= 0 || pointValueInr <= 0) return 0;
  return Math.floor(amountInr / pointValueInr);
}

/**
 * Max redeemable points =
 * MIN(available, orderValue / pointValue, 30% orderValue / pointValue)
 * when orderValue >= minimum.
 */
export function calculateMaxRedeemablePoints(
  orderValueInr: number,
  availablePoints: number,
  options?: {
    minOrderValue?: number;
    maxRedeemPercent?: number;
    pointValueInr?: number;
  },
): number {
  const minOrder = options?.minOrderValue ?? BAJRIPRO_MIN_REDEEM_ORDER_VALUE;
  const maxPercent = options?.maxRedeemPercent ?? BAJRIPRO_MAX_ORDER_REDEEM_PERCENT;
  const pointValue = options?.pointValueInr ?? BAJRIPRO_POINT_VALUE_INR;

  if (orderValueInr < minOrder || availablePoints <= 0) {
    return 0;
  }

  const capByOrderValue = discountAmountToPoints(orderValueInr, pointValue);
  const capByPercent = discountAmountToPoints(orderValueInr * maxPercent, pointValue);

  return Math.max(0, Math.min(availablePoints, capByOrderValue, capByPercent));
}

export function calculateLoyaltyDiscountPreview(params: {
  pointsApplied: boolean;
  availablePoints: number;
  orderValueInr: number;
  minOrderValue?: number;
  maxRedeemPercent?: number;
  pointValueInr?: number;
}): { redeemablePoints: number; discountAmount: number } {
  if (!params.pointsApplied) {
    return { redeemablePoints: 0, discountAmount: 0 };
  }

  const redeemablePoints = calculateMaxRedeemablePoints(
    params.orderValueInr,
    params.availablePoints,
    {
      minOrderValue: params.minOrderValue,
      maxRedeemPercent: params.maxRedeemPercent,
      pointValueInr: params.pointValueInr,
    },
  );

  return {
    redeemablePoints,
    discountAmount: pointsToDiscountAmount(
      redeemablePoints,
      params.pointValueInr ?? BAJRIPRO_POINT_VALUE_INR,
    ),
  };
}

export function formatPointsInr(amount: number): string {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
