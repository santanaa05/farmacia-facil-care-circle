import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const favoritesQuery = (userId: string) =>
  queryOptions({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", userId);
      if (error) throw error;
      return data.map((d) => d.product_id);
    },
  });

export const couponsQuery = () =>
  queryOptions({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("min_total");
      if (error) throw error;
      return data;
    },
  });

export function useFavorites() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const uid = user?.id ?? "";
  const { data = [] } = useQuery({ ...favoritesQuery(uid), enabled: !!uid });
  const ids = new Set(data);

  const toggle = async (productId: string) => {
    if (!user) {
      toast("Entre para salvar produtos");
      return nav({ to: "/auth" });
    }
    if (ids.has(productId)) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);
      if (error) return toast.error(error.message);
      toast("Removido dos salvos");
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, product_id: productId });
      if (error) {
        if (error.code === "23505") return toast("Esse produto já está nos salvos");
        return toast.error(error.message);
      }
      toast.success("Salvo nos favoritos");
    }
    qc.invalidateQueries({ queryKey: ["favorites", user.id] });
  };

  return { ids, count: data.length, isFav: (id: string) => ids.has(id), toggle };
}
