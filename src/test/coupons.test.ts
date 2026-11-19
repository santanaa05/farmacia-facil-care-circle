import { describe, expect, it } from "vitest";

import { couponDiscount, couponFor, type CouponLike } from "@/lib/coupons";

// Os cupons reais do banco: BEMVINDO10 (10%, sem mínimo), SAUDE15 (15%, a partir de R$ 99),
// QUAREMA20 (20%, a partir de R$ 199).
const coupons: CouponLike[] = [
  { code: "BEMVINDO10", percent: 10, min_total: 0, active: true },
  { code: "SAUDE15", percent: 15, min_total: 99, active: true },
  { code: "QUAREMA20", percent: 20, min_total: 199, active: true },
  { code: "EXPIRADO", percent: 50, min_total: 0, active: false },
];

describe("Cupons", () => {
  it("encontra o cupom digitado sem diferenciar maiúsculas", () => {
    expect(couponFor("  bemvindo10 ", coupons)?.code).toBe("BEMVINDO10");
  });

  it("ignora código vazio, inexistente ou desativado", () => {
    expect(couponFor("", coupons)).toBeUndefined();
    expect(couponFor("NAOEXISTE", coupons)).toBeUndefined();
    expect(couponFor("EXPIRADO", coupons)).toBeUndefined();
  });

  it("não dá desconto quando a compra é menor que o mínimo do cupom", () => {
    expect(couponDiscount(98.9, couponFor("SAUDE15", coupons))).toBe(0);
    expect(couponDiscount(198.9, couponFor("QUAREMA20", coupons))).toBe(0);
  });

  it("aplica o percentual quando a compra atinge o mínimo", () => {
    expect(couponDiscount(99, couponFor("SAUDE15", coupons))).toBe(14.85);
    expect(couponDiscount(200, couponFor("QUAREMA20", coupons))).toBe(40);
    expect(couponDiscount(29.9, couponFor("BEMVINDO10", coupons))).toBe(2.99);
  });

  it("sem cupom não há desconto", () => {
    expect(couponDiscount(500)).toBe(0);
  });
});
