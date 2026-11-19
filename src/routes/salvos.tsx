import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { RoleGuard } from "@/components/RoleGuard";
import { favoritesQuery } from "@/lib/favorites";
import { productsQuery } from "@/lib/products";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/salvos")({
  head: () => ({
    meta: [
      { title: "Produtos salvos — FarmaQuarema" },
      { name: "description", content: "Os produtos que você guardou para comprar depois na FarmaQuarema." },
      { property: "og:title", content: "Produtos salvos — FarmaQuarema" },
      { property: "og:description", content: "Sua lista de favoritos na FarmaQuarema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RoleGuard><Salvos /></RoleGuard>,
});

function Salvos() {
  const { user } = useAuth();
  const { data: products = [] } = useQuery(productsQuery());
  const { data: favIds = [] } = useQuery(favoritesQuery(user!.id));
  const list = products.filter((p) => favIds.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold"><Heart className="h-6 w-6 fill-sale text-sale" />Produtos salvos</h1>
      <p className="text-sm text-muted-foreground">{list.length} {list.length === 1 ? "produto" : "produtos"} na sua lista</p>
      {!list.length ? (
        <div className="mt-10 rounded-xl border bg-card p-10 text-center">
          <p className="font-semibold">Sua lista está vazia</p>
          <p className="mt-1 text-sm text-muted-foreground">Toque no coração de qualquer produto para guardá-lo aqui.</p>
          <Button asChild className="mt-5"><Link to="/produtos">Ver produtos</Link></Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}
