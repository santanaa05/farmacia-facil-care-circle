import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoleGuard } from "@/components/RoleGuard";
import { OrderBadge } from "@/components/OrderBadge";
import { useAuth } from "@/lib/auth";
import { brl } from "@/lib/cart";

export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — FarmaQuarema" },
      { name: "description", content: "Acompanhe seus pedidos na FarmaQuarema." },
      { property: "og:title", content: "Minha conta — FarmaQuarema" },
      { property: "og:description", content: "Seus pedidos e dados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RoleGuard><Conta /></RoleGuard>,
});

function Conta() {
  const { user, roles } = useAuth();
  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user!.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-extrabold">Olá, {user?.user_metadata?.["full_name"] ?? user?.email}</h1>
      <p className="text-sm text-muted-foreground">Perfil: {roles.join(", ")}</p>
      <h2 className="mt-8 text-xl font-bold">Meus pedidos</h2>
      {!orders.length && <p className="mt-3 text-muted-foreground">Você ainda não fez pedidos.</p>}
      <div className="mt-4 space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">Pedido #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
              <OrderBadge status={o.status} />
            </div>
            <ul className="mt-2 text-sm text-muted-foreground">{o.order_items.map((i) => <li key={i.id}>{i.quantity}x {i.name}</li>)}</ul>
            {o.coupon_code && <p className="mt-1 text-xs font-semibold text-primary">Cupom {o.coupon_code} aplicado</p>}
            <p className="mt-2 font-bold text-primary-deep">{brl(Number(o.total))}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
