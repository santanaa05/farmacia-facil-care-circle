import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CATEGORY_DETAILS } from "@/lib/categories";
import type { Product } from "@/lib/product-ranking";

export function CategoryGrid({ products }: { products: Product[] }) {
  return (
    <section className="mt-12" aria-labelledby="category-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Encontre mais rápido</p>
          <h2 id="category-title" className="mt-1 text-2xl font-extrabold">Compre por categoria</h2>
        </div>
        <Link to="/produtos" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex">
          Ver catálogo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
        {CATEGORY_DETAILS.map((category) => {
          const Icon = category.icon;
          const count = products.filter((product) => product.category === category.name).length;
          return (
            <Link
              key={category.name}
              to="/produtos"
              search={{ cat: category.name }}
              className="group rounded-xl border bg-card p-3 transition hover:border-primary"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${category.tone}`}>
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <h3 className="mt-2 text-xs font-extrabold group-hover:text-primary sm:text-sm">{category.name}</h3>
              <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{count} {count === 1 ? "produto" : "produtos"}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
