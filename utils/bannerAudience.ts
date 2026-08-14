export function isPromoBannerEligible(
  audience: string | null | undefined,
  ctx: {
    isLoggedIn: boolean;
    freeBikeRemaining: number;
    freeBikeUsed: number;
  },
): boolean {
  const value = (audience || 'ALL').toUpperCase();
  if (value === 'ALL') return true;
  if (value === 'NEW_CUSTOMERS') {
    return !ctx.isLoggedIn || ctx.freeBikeUsed === 0;
  }
  if (value === 'FREE_BIKE_REMAINING') {
    return !ctx.isLoggedIn || ctx.freeBikeRemaining > 0;
  }
  if (value === 'FREE_BIKE_EXHAUSTED') {
    return ctx.isLoggedIn && ctx.freeBikeRemaining <= 0;
  }
  return true;
}
