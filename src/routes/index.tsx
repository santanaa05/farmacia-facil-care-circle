import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Truck, Store, ShieldCheck, Percent, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { ProductTabs } from "@/components/ProductTabs";
import { CategoryGrid } from "@/components/CategoryGrid";
import { useOfferCountdown } from "@/components/QuickAccessBar";
import { productsQuery } from "@/lib/products";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FarmaQuaresma — Farmácia online com ofertas" },
      { name: "description", content: "Compre remédios, vitaminas e produtos de higiene na FarmaQuaresma com descontos e entrega rápida." },
      { property: "og:title", content: "FarmaQuaresma — Farmácia online com ofertas" },
      { property: "og:description", content: "Remédios, vitaminas e higiene com descontos e entrega rápida." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const offPercent = (p: Tables<"products">) => (p.old_price ? 1 - Number(p.price) / Number(p.old_price) : 0);

function Index() {
  const { data = [] } = useQuery(productsQuery());
  const left = useOfferCountdown();
  const flash = [...data].filter((p) => p.old_price).sort((a, b) => offPercent(b) - offPercent(a)).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4">
      <section className="mt-6 overflow-hidden rounded-2xl bg-hero p-8 text-primary-foreground md:p-14">
        <p className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">SEMANA DA SAÚDE</p>
        <h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-tight md:text-5xl">Até 40% off em vitaminas e dermocosméticos</h1>
        <p className="mt-3 max-w-md opacity-90">Cuide de você com quem entende. Consulte o prazo de entrega pelo seu CEP.</p>
        <Button asChild size="lg" variant="secondary" className="mt-6"><Link to="/produtos">Ver ofertas</Link></Button>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[[Truck, "Entrega rápida"], [Store, "Retire na loja"], [Percent, "Descontos todo dia"], [ShieldCheck, "Compra segura"]].map(([I, t]) => {
          const Icon = I as typeof Truck;
          return <div key={t as string} className="flex items-center gap-3 rounded-xl border bg-card p-4"><Icon className="h-6 w-6 text-primary" /><span className="text-sm font-semibold">{t as string}</span></div>;
        })}
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-extrabold"><Zap className="h-6 w-6 text-spark" />Oferta relâmpago</h2>
            <p className="mt-1 inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-ink-foreground">
              Aproveite agora! Termina em <span className="font-mono tabular-nums">{left ?? "--h --m --s"}</span>
            </p>
          </div>
          <Link to="/produtos" search={{ sort: "desconto", off: true }} className="text-sm font-semibold text-primary">Ver todas</Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">{flash.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>

      <ProductTabs products={data} />

      <CategoryGrid products={data} />

    </div>
  );
}
