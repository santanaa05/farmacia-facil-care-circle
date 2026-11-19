import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_DETAILS } from "@/lib/categories";

export const CATEGORIES = CATEGORY_DETAILS.map((category) => category.name);
export const productsQuery = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
export const STATUS = ["recebido", "separando", "saiu para entrega", "entregue", "cancelado"];
