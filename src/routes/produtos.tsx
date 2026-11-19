import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { useOfferCountdown } from "@/components/QuickAccessBar";
import { productsQuery, CATEGORIES } from "@/lib/products";
import type { Tables } from "@/integrations/supabase/types";

type Sort = "buscados" | "desconto" | "preco";

export const Route = createFileRoute("/produtos")({
  validateSearch: (s: Record<string, unknown>): {
    q?: string | undefined;
    cat?: string | undefined;
    sort?: Sort | undefined;
    off?: boolean | undefined;
  } => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    cat: typeof s["cat"] === "string" ? s["cat"] : undefined,
    sort: s["sort"] === "buscados" || s["sort"] === "desconto" || s["sort"] === "preco" ? s["sort"] : undefined,
    off: s["off"] === true || s["off"] === "1" || s["off"] === "true" ? true : undefined,
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

const offPercent = (p: Tables<"products">) => (p.old_price ? 1 - Number(p.price) / Number(p.old_price) : 0);

const SORTS: { key: Sort | undefined; label: string }[] = [
  { key: undefined, label: "Relevância" },
  { key: "buscados", label: "Mais buscados" },
  { key: "desconto", label: "Maiores descontos" },
  { key: "preco", label: "Menor preço" },
];

function Produtos() {
  const { q, cat, sort, off } = Route.useSearch();
  const left = useOfferCountdown();
  const { data = [], isLoading } = useQuery(productsQuery());

  let list = data.filter(
    (p) => (!cat || p.category === cat) && (!q || `${p.name} ${p.brand} ${p.description}`.toLowerCase().includes(q.toLowerCase())),
  );
  if (off) list = list.filter((p) => !!p.old_price);
  if (sort === "buscados") list = [...list].sort((a, b) => b.popularity - a.popularity);
  if (sort === "desconto") list = [...list].sort((a, b) => offPercent(b) - offPercent(a));
  if (sort === "preco") list = [...list].sort((a, b) => Number(a.price) - Number(b.price));

  const title = q
    ? `Resultados para "${q}"`
    : off && sort === "desconto"
      ? "Oferta relâmpago"
      : sort === "buscados"
        ? "Mais buscados"
        : cat ?? "Todos os produtos";

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
      <aside className="hidden w-52 shrink-0 md:block">
        <p className="font-bold">Categorias</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li><Link to="/produtos" search={{ sort, off }} className={!cat ? "font-bold text-primary" : "hover:text-primary"}>Todas</Link></li>
          {CATEGORIES.map((c) => <li key={c}><Link to="/produtos" search={{ cat: c, sort, off }} className={cat === c ? "font-bold text-primary" : "hover:text-primary"}>{c}</Link></li>)}
        </ul>
      </aside>
      <div className="flex-1">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {off && sort === "desconto" && (
          <p className="mt-1 inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-ink-foreground">
            Termina em <span className="font-mono tabular-nums">{left ?? "--h --m --s"}</span>
          </p>
        )}
        <p className="text-sm text-muted-foreground">{list.length} produtos</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {SORTS.map((s) => (
            <Link
              key={s.label}
              to="/produtos"
              search={{ q, cat, sort: s.key, off }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                sort === s.key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary hover:text-primary"
              }`}
            >
              {s.label}
            </Link>
          ))}
          <Link
            to="/produtos"
            search={{ q, cat, sort: sort ?? "desconto", off: off ? undefined : true }}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              off ? "border-sale bg-sale text-sale-foreground" : "bg-card hover:border-sale hover:text-sale"
            }`}
          >
            Só com desconto
          </Link>
        </div>

        {isLoading ? <p className="mt-6">Carregando...</p> : (
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        )}
      </div>
    </div>
  );
}
