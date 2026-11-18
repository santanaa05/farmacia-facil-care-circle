import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RoleGuard } from "@/components/RoleGuard";
import { OrderBadge } from "@/components/OrderBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { brl } from "@/lib/cart";
import { STATUS, productsQuery } from "@/lib/products";

export const Route = createFileRoute("/atendente")({
  head: () => ({
    meta: [
      { title: "Painel do Atendente — FarmaQuarema" },
      { name: "description", content: "Gerencie pedidos e consulte estoque." },
      { property: "og:title", content: "Painel do Atendente — FarmaQuarema" },
      { property: "og:description", content: "Pedidos e estoque." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RoleGuard allow={["atendente", "admin"]}><Atendente /></RoleGuard>,
});

function Atendente() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("todos");
  const [q, setQ] = useState("");
  const { data: orders = [] } = useQuery({
    queryKey: ["all-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => (await supabase.from("profiles").select("*")).data ?? [],
  });
  const { data: products = [] } = useQuery(productsQuery());
  const name = (id: string) => profiles.find((p) => p.id === id)?.full_name ?? profiles.find((p) => p.id === id)?.email ?? "Cliente";

  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["all-orders"] });
  };
  const shown = orders.filter((o) => filter === "todos" || o.status === filter);
  const stock = products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-extrabold">Painel do Atendente</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {STATUS.map((s) => (
          <div key={s} className="rounded-xl border bg-card p-4"><p className="text-xs capitalize text-muted-foreground">{s}</p><p className="text-2xl font-extrabold">{orders.filter((o) => o.status === s).length}</p></div>
        ))}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Pedidos</h2>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos</SelectItem>{STATUS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="mt-4 space-y-3">
            {!shown.length && <p className="text-muted-foreground">Nenhum pedido.</p>}
            {shown.map((o) => (
              <div key={o.id} className="rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><p className="font-semibold">#{o.id.slice(0, 8)} · {name(o.user_id)}</p><p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")} · {o.address}</p></div>
                  <div className="flex items-center gap-2">
                    <OrderBadge status={o.status} />
                    <Select value={o.status} onValueChange={(v) => update(o.id, v)}>
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <ul className="mt-2 text-sm text-muted-foreground">{o.order_items.map((i) => <li key={i.id}>{i.quantity}x {i.name}</li>)}</ul>
                <p className="mt-1 font-bold">{brl(Number(o.total))}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-xl font-bold">Consulta de estoque</h2>
          <Input className="mt-4" placeholder="Buscar produto" value={q} onChange={(e) => setQ(e.target.value)} />
          <ul className="mt-3 divide-y rounded-xl border bg-card">
            {stock.map((p) => (
              <li key={p.id} className="flex justify-between gap-2 p-3 text-sm"><span className="line-clamp-1">{p.name}</span><span className={p.stock < 20 ? "font-bold text-sale" : "font-semibold"}>{p.stock}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
