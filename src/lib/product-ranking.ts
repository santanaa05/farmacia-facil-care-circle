import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;

export const discountRatio = (product: Product) => {
  if (!product.old_price || Number(product.old_price) <= Number(product.price)) return 0;
  return 1 - Number(product.price) / Number(product.old_price);
};

export function mostViewed(products: Product[], limit = 8) {
  return [...products]
    .sort((a, b) => b.popularity - a.popularity || b.sales_count - a.sales_count)
    .slice(0, limit);
}

export function mostPurchased(products: Product[], limit = 8) {
  return [...products]
    .sort((a, b) => b.sales_count - a.sales_count || b.popularity - a.popularity)
    .slice(0, limit);
}

export function weeklyOffers(products: Product[], limit = 8) {
  return products
    .filter((product) => discountRatio(product) > 0)
    .sort((a, b) => discountRatio(b) - discountRatio(a) || b.popularity - a.popularity)
    .slice(0, limit);
}
