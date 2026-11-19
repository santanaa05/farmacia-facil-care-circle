import { Pill, Sparkles, Droplets, Baby, HeartPulse, Leaf, FileText, Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { brl, useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import type { Tables } from "@/integrations/supabase/types";

const icons: Record<string, typeof Pill> = { Medicamentos: Pill, Vitaminas: Leaf, "Dermocosméticos": Sparkles, Higiene: Droplets, Infantil: Baby, "Saúde": HeartPulse };

export function ProductCard({ p }: { p: Tables<"products"> }) {
  const { add } = useCart();
  const { isFav, toggle } = useFavorites();
  const Icon = icons[p.category] ?? Pill;
  const off = p.old_price ? Math.round((1 - Number(p.price) / Number(p.old_price)) * 100) : 0;
  const saved = isFav(p.id);
  return (
    <div className="group flex h-full flex-col rounded-xl border bg-card p-4 shadow-card transition hover:-translate-y-0.5">
      <div className="relative mb-3 flex aspect-square items-center justify-center rounded-lg bg-secondary">
        {p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full rounded-lg object-contain p-2 transition duration-300 group-hover:scale-[1.03]" /> : <Icon className="h-16 w-16 text-primary" strokeWidth={1.4} />}
        {off > 0 && <span className="absolute left-2 top-2 rounded-full bg-sale px-2 py-0.5 text-xs font-bold text-sale-foreground">-{off}%</span>}
        <button
          type="button"
          aria-label={saved ? `Remover ${p.name} dos salvos` : `Salvar ${p.name}`}
          aria-pressed={saved}
          onClick={() => toggle(p.id)}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 shadow-card transition hover:scale-105"
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-sale text-sale" : "text-muted-foreground"}`} />
        </button>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{p.brand}</p>
      <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-medium">{p.name}</h3>
      {p.requires_prescription && <p className="mt-1 flex items-center gap-1 text-xs text-sale"><FileText className="h-3 w-3" />Exige receita</p>}
      <div className="mt-auto pt-3">
        {p.old_price && <p className="text-xs text-muted-foreground line-through">{brl(Number(p.old_price))}</p>}
        <p className="text-xl font-extrabold text-primary-deep">{brl(Number(p.price))}</p>
        <Button className="mt-3 w-full" disabled={p.stock <= 0}
          onClick={() => { add({ product_id: p.id, name: p.name, price: Number(p.price) }); toast.success("Adicionado ao carrinho"); }}>
          {p.stock > 0 ? "Comprar" : "Esgotado"}
        </Button>
      </div>
    </div>
  );
}
