import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/product-ranking";

export function CatalogCarousel({ products }: { products: Product[] }) {
  const carousel = useRef<HTMLDivElement>(null);

  const move = (direction: -1 | 1) => {
    const element = carousel.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * 0.85, behavior: "smooth" });
  };

  if (!products.length) return <p className="mt-8 rounded-2xl border bg-card p-8 text-center text-muted-foreground">Nenhum produto encontrado.</p>;

  return (
    <div className="mt-5">
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="icon" aria-label="Ver produtos anteriores" onClick={() => move(-1)} className="rounded-full"><ChevronLeft className="h-5 w-5" /></Button>
        <Button type="button" variant="outline" size="icon" aria-label="Ver próximos produtos" onClick={() => move(1)} className="rounded-full"><ChevronRight className="h-5 w-5" /></Button>
      </div>
      <div ref={carousel} className="mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Carrossel de produtos">
        {products.map((product) => (
          <div key={product.id} className="w-[226px] shrink-0 snap-start sm:w-[248px] xl:w-[270px]">
            <ProductCard p={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
