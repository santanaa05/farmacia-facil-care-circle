export type CouponLike = { code: string; percent: number; min_total: number; active: boolean };

export function couponFor(code: string, coupons: CouponLike[]): CouponLike | undefined {
  const typed = code.trim().toUpperCase();
  if (!typed) return undefined;
  return coupons.find((c) => c.active && c.code.toUpperCase() === typed);
}

export function couponDiscount(total: number, coupon?: CouponLike): number {
  if (!coupon || !coupon.active || total < coupon.min_total) return 0;
  return Number(((total * coupon.percent) / 100).toFixed(2));
}
