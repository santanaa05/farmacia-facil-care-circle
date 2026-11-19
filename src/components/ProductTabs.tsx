import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgePercent, ChevronLeft, ChevronRight, Eye, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { mostPurchased, mostViewed, weeklyOffers, type Product } from "@/lib/product-ranking";

type TabId = "vistos" | "comprados" | "ofertas";

const tabs = [
  { id: "vistos" as const, label: "Mais vistos", icon: Eye, select: mostViewed, search: { sort: "buscados" as const } },
  { id: "comprados" as const, label: "Mais comprados", icon: ShoppingBag, select: mostPurchased, search: { sort: "vendidos" as const } },
  { id: "ofertas" as const, label: "Ofertas da semana", icon: BadgePercent, select: weeklyOffers, search: { sort: "desconto" as const, off: true } },
];

export function ProductTabs({ products }: { products: Product[] }) {
  const [active, setActive] = useState<TabId>("vistos");
  const carousel = useRef<HTMLDivElement>(null);
  const current = tabs.find((tab) => tab.id === active)!;
  const visible = current.select(products, 8);

  const selectTab = (id: TabId) => {
    setActive(id);
    if (carousel.current) carousel.current.scrollLeft = 0;
  };

  const move = (direction: -1 | 1) => {
    const element = carousel.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="mt-12" aria-labelledby="product-highlights">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Escolhas para você</p>
          <h2 id="product-highlights" className="mt-1 text-2xl font-extrabold md:text-3xl">Destaques da FarmaQuarema</h2>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="icon" aria-label="Ver produtos anteriores" onClick={() => move(-1)} className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button type="button" variant="outline" size="icon" aria-label="Ver próximos produtos" onClick={() => move(1)} className="rounded-full">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-b">
        <div role="tablist" aria-label="Destaques de produtos" className="flex max-w-full gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                onClick={() => selectTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
                  selected ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <Link to="/produtos" search={current.search} className="mb-3 text-sm font-semibold text-primary hover:underline">
          Ver todos
        </Link>
      </div>

      <div
        key={current.id}
        ref={carousel}
        role="tabpanel"
        id={`panel-${current.id}`}
        aria-labelledby={`tab-${current.id}`}
        className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visible.map((product) => (
          <div key={`${current.id}-${product.id}`} className="w-[236px] shrink-0 snap-start sm:w-[260px] xl:w-[282px]">
            <ProductCard p={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
