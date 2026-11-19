import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { couponsQuery } from "@/lib/favorites";
import { brl } from "@/lib/cart";

export const Route = createFileRoute("/cupons")({
  head: () => ({
    meta: [
      { title: "Cupons de desconto — FarmaQuarema" },
      { name: "description", content: "Cupons ativos da FarmaQuarema: copie o código e use no carrinho." },
      { property: "og:title", content: "Cupons de desconto — FarmaQuarema" },
      { property: "og:description", content: "Copie um código de desconto e use na sua compra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Cupons,
});

function Cupons() {
  const { data: coupons = [], isLoading } = useQuery(couponsQuery());
  const active = coupons.filter((c) => c.active);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Cupom ${code} copiado`);
    } catch {
      toast("Copie manualmente: " + code);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold"><Ticket className="h-6 w-6 text-spark" />Cupons de desconto</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Copie um código e cole no campo de cupom do carrinho. O desconto é conferido e aplicado na finalização do pedido.
      </p>

      {isLoading ? <p className="mt-6">Carregando...</p> : !active.length ? (
        <p className="mt-6 rounded-xl border bg-card p-8 text-center text-muted-foreground">Nenhum cupom ativo no momento.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {active.map((c) => (
            <div key={c.code} className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-card">
              <span className="absolute inset-x-0 top-0 h-1 bg-spark" />
              <p className="text-3xl font-extrabold text-primary-deep">{c.percent}%<span className="text-base font-bold"> off</span></p>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              <p className="mt-3 font-mono text-sm font-bold tracking-wider text-ink">{c.code}</p>
              <p className="text-xs text-muted-foreground">
                {c.min_total > 0 ? `Válido para compras acima de ${brl(Number(c.min_total))}` : "Válido para qualquer compra"}
              </p>
              <Button size="sm" className="mt-4 w-full" onClick={() => copy(c.code)}>
                <Copy className="h-4 w-4" />Copiar código
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-xl border bg-secondary p-5 text-sm text-secondary-foreground">
        <p className="flex items-center gap-2 font-semibold"><Check className="h-4 w-4" />Como usar</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 opacity-90">
          <li>Adicione os produtos ao carrinho.</li>
          <li>Cole o código no campo &quot;Cupom de desconto&quot;.</li>
          <li>Confira o total com desconto e finalize o pedido.</li>
        </ol>
        <Link to="/produtos" className="mt-3 inline-block font-semibold text-primary">Ver produtos em oferta</Link>
      </div>
    </div>
  );
}
