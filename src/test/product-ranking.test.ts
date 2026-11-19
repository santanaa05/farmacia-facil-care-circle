import { describe, expect, it } from "vitest";
import { mostPurchased, mostViewed, weeklyOffers, type Product } from "@/lib/product-ranking";

function product(id: string, values: Partial<Product>): Product {
  return {
    id,
    name: id,
    brand: null,
    category: "Saúde",
    description: null,
    price: 10,
    old_price: null,
    stock: 10,
    requires_prescription: false,
    image_url: null,
    created_at: "",
    popularity: 0,
    sales_count: 0,
    ...values,
  };
}

describe("rankings da vitrine", () => {
  it("ordena Mais vistos pelo número de visualizações", () => {
    const items = [product("menos", { popularity: 30 }), product("mais", { popularity: 90 })];
    expect(mostViewed(items).map((item) => item.id)).toEqual(["mais", "menos"]);
  });

  it("ordena Mais comprados pelas unidades vendidas", () => {
    const items = [product("sete", { sales_count: 7 }), product("doze", { sales_count: 12 })];
    expect(mostPurchased(items).map((item) => item.id)).toEqual(["doze", "sete"]);
  });

  it("mostra em Ofertas da semana somente descontos reais, do maior para o menor", () => {
    const items = [
      product("sem-desconto", { price: 20, old_price: 20 }),
      product("dez", { price: 90, old_price: 100 }),
      product("vinte-e-cinco", { price: 75, old_price: 100 }),
    ];
    expect(weeklyOffers(items).map((item) => item.id)).toEqual(["vinte-e-cinco", "dez"]);
  });
});
