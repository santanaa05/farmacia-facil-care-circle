import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { productsQuery, CATEGORIES } from "@/lib/products";

export const Route = createFileRoute("/produtos")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined; cat?: string | undefined } => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    cat: typeof s["cat"] === "string" ? s["cat"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Produtos — FarmaQuarema" },
      { name: "description", content: "Todos os medicamentos, vitaminas e produtos de saúde da FarmaQuarema." },
      { property: "og:title", content: "Produtos — FarmaQuarema" },
      { property: "og:description", content: "Medicamentos, vitaminas e produtos de saúde." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Produtos,
});

function Produtos() {
  const { q, cat } = Route.useSearch();
  const { data = [], isLoading } = useQuery(productsQuery());
  const list = data.filter((p) => (!cat || p.category === cat) && (!q || `${p.name} ${p.brand} ${p.description}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
      <aside className="hidden w-52 shrink-0 md:block">
        <p className="font-bold">Categorias</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li><Link to="/produtos" className={!cat ? "font-bold text-primary" : "hover:text-primary"}>Todas</Link></li>
          {CATEGORIES.map((c) => <li key={c}><Link to="/produtos" search={{ cat: c }} className={cat === c ? "font-bold text-primary" : "hover:text-primary"}>{c}</Link></li>)}
        </ul>
      </aside>
      <div className="flex-1">
        <h1 className="text-2xl font-extrabold">{q ? `Resultados para "${q}"` : cat ?? "Todos os produtos"}</h1>
        <p className="text-sm text-muted-foreground">{list.length} produtos</p>
        {isLoading ? <p className="mt-6">Carregando...</p> : (
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        )}
      </div>
    </div>
  );
}
