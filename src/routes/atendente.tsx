import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ClipboardList, Headset, Lock, PackageSearch } from "lucide-react";
import { RestrictedArea } from "@/components/RestrictedArea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RoleGuard } from "@/components/RoleGuard";
import { OrderBadge } from "@/components/OrderBadge";
import { WorkspaceHeader, workspaceTabTrigger, workspaceTabsList } from "@/components/Workspace";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brl } from "@/lib/cart";
import { STATUS, productsQuery } from "@/lib/products";

export const Route = createFileRoute("/atendente")({
  head: () => ({
    meta: [
      { title: "Painel do Atendente — FarmaQuaresma" },
      { name: "description", content: "Gerencie pedidos e consulte estoque." },
      { property: "og:title", content: "Painel do Atendente — FarmaQuaresma" },
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
  const name = (id: string) => profiles.find((profile) => profile.id === id)?.full_name ?? profiles.find((profile) => profile.id === id)?.email ?? "Cliente";

  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["all-orders"] });
  };
  const shown = orders.filter((order) => filter === "todos" || order.status === filter);
  const stock = products.filter((product) => !q || product.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <WorkspaceHeader icon={Headset} eyebrow="Área do atendente" title="Central de atendimento" description="Gerencie pedidos e acompanhe o estoque da loja." />

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {STATUS.map((status) => (
          <div key={status} className="rounded-2xl border bg-card p-4 shadow-card">
            <p className="text-xs capitalize text-muted-foreground">{status}</p>
            <p className="mt-1 text-2xl font-extrabold">{orders.filter((order) => order.status === status).length}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="pedidos" className="mt-6">
        <TabsList className={`${workspaceTabsList} max-w-2xl grid-cols-3`}>
          <TabsTrigger value="pedidos" className={workspaceTabTrigger}><ClipboardList className="h-4 w-4" />Pedidos</TabsTrigger>
          <TabsTrigger value="estoque" className={workspaceTabTrigger}><PackageSearch className="h-4 w-4" />Consulta de estoque</TabsTrigger>
          <TabsTrigger value="restrito" className={workspaceTabTrigger}><Lock className="h-4 w-4" />Área restrita</TabsTrigger>
        </TabsList>

        <TabsContent value="restrito" className="mt-6"><RestrictedArea /></TabsContent>

        <TabsContent value="pedidos" className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Pedidos recebidos</h2>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos</SelectItem>{STATUS.map((status) => <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="mt-4 space-y-3">
            {!shown.length && <p className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">Nenhum pedido neste status.</p>}
            {shown.map((order) => (
              <div key={order.id} className="rounded-2xl border bg-card p-5 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="font-semibold">#{order.id.slice(0, 8)} · {name(order.user_id)}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("pt-BR")} · {order.address}</p></div>
                  <div className="flex items-center gap-2">
                    <OrderBadge status={order.status} />
                    <Select value={order.status} onValueChange={(value) => update(order.id, value)}>
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS.map((status) => <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">{order.order_items.map((item) => <li key={item.id}>{item.quantity}x {item.name}</li>)}</ul>
                <p className="mt-3 text-lg font-extrabold text-primary-deep">{brl(Number(order.total))}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="estoque" className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-xl font-bold">Consulta de estoque</h2><p className="text-sm text-muted-foreground">Quantidades disponíveis em {products.length} produtos.</p></div>
            <Input className="max-w-sm" placeholder="Buscar produto" value={q} onChange={(event) => setQ(event.target.value)} />
          </div>
          <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stock.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 text-sm shadow-card">
                <span className="line-clamp-2 font-medium">{product.name}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${product.stock < 20 ? "bg-sale/10 text-sale" : "bg-secondary text-primary"}`}>{product.stock} un.</span>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}
