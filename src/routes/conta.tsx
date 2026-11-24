import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Package, ShoppingBag, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RoleGuard } from "@/components/RoleGuard";
import { OrderBadge } from "@/components/OrderBadge";
import { ProductCard } from "@/components/ProductCard";
import { WorkspaceHeader, workspaceTabTrigger, workspaceTabsList } from "@/components/Workspace";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { brl } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { productsQuery } from "@/lib/products";

export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — FarmaQuaresma" },
      { name: "description", content: "Acompanhe seus pedidos na FarmaQuaresma." },
      { property: "og:title", content: "Minha conta — FarmaQuaresma" },
      { property: "og:description", content: "Seus pedidos e dados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RoleGuard><Conta /></RoleGuard>,
});

function Conta() {
  const { user, roles } = useAuth();
  const { ids } = useFavorites();
  const { data: products = [] } = useQuery(productsQuery());
  const saved = products.filter((product) => ids.has(product.id));
  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user!.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <WorkspaceHeader
        icon={UserRound}
        eyebrow="Área do cliente"
        title={`Olá, ${user?.user_metadata?.["full_name"] ?? user?.email}`}
        description="Acompanhe seus pedidos, favoritos e dados em um só lugar."
      />

      <Tabs defaultValue="pedidos" className="mt-6">
        <TabsList className={`${workspaceTabsList} grid-cols-3`}>
          <TabsTrigger value="pedidos" className={workspaceTabTrigger}><Package className="h-4 w-4" />Meus pedidos</TabsTrigger>
          <TabsTrigger value="salvos" className={workspaceTabTrigger}><Heart className="h-4 w-4" />Salvos</TabsTrigger>
          <TabsTrigger value="dados" className={workspaceTabTrigger}><UserRound className="h-4 w-4" />Meus dados</TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos" className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Histórico de pedidos</h2>
            <span className="text-sm text-muted-foreground">{orders.length} {orders.length === 1 ? "pedido" : "pedidos"}</span>
          </div>
          {!orders.length && (
            <div className="mt-4 rounded-2xl border bg-card p-8 text-center">
              <ShoppingBag className="mx-auto h-9 w-9 text-primary" />
              <p className="mt-3 font-bold">Você ainda não fez pedidos</p>
              <p className="mt-1 text-sm text-muted-foreground">Encontre o que precisa no nosso catálogo.</p>
              <Button asChild className="mt-4"><Link to="/produtos">Ver produtos</Link></Button>
            </div>
          )}
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border bg-card p-5 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">Pedido #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                  <OrderBadge status={order.status} />
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">{order.order_items.map((item) => <li key={item.id}>{item.quantity}x {item.name}</li>)}</ul>
                {order.coupon_code && <p className="mt-2 text-xs font-semibold text-primary">Cupom {order.coupon_code} aplicado</p>}
                <p className="mt-3 text-lg font-extrabold text-primary-deep">{brl(Number(order.total))}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="salvos" className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Produtos salvos</h2>
            <Button asChild variant="outline" size="sm"><Link to="/salvos">Ver todos</Link></Button>
          </div>
          {!saved.length ? (
            <div className="mt-4 rounded-2xl border bg-card p-8 text-center">
              <Heart className="mx-auto h-9 w-9 text-primary" />
              <p className="mt-3 font-bold">Sua lista está vazia</p>
              <p className="mt-1 text-sm text-muted-foreground">Toque no coração de um produto para guardá-lo aqui.</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">{saved.slice(0, 6).map((product) => <ProductCard key={product.id} p={product} />)}</div>
          )}
        </TabsContent>

        <TabsContent value="dados" className="mt-6">
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <h2 className="text-xl font-bold">Dados da conta</h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <div><dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Nome</dt><dd className="mt-1 font-semibold">{user?.user_metadata?.["full_name"] ?? "Não informado"}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">E-mail</dt><dd className="mt-1 break-all font-semibold">{user?.email}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Perfil de acesso</dt><dd className="mt-1 capitalize">{roles.join(", ")}</dd></div>
            </dl>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
