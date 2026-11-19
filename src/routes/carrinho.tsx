import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Plus, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { couponsQuery } from "@/lib/favorites";
import { brl, useCart } from "@/lib/cart";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — FarmaQuarema" },
      { name: "description", content: "Revise seus produtos, aplique um cupom e finalize a compra." },
      { property: "og:title", content: "Carrinho — FarmaQuarema" },
      { property: "og:description", content: "Finalize sua compra na FarmaQuarema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Carrinho,
});

function Carrinho() {
  const { items, setQty, total, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [address, setAddress] = useState("");
  const [coupon, setCoupon] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: coupons = [] } = useQuery(couponsQuery());

  const typed = coupon.trim().toUpperCase();
  const applied = typed ? coupons.find((c) => c.active && c.code.toUpperCase() === typed) : undefined;
  const min = Number(applied?.min_total ?? 0);
  const usable = !!applied && total >= min;
  const discount = usable ? Number(((total * Number(applied!.percent)) / 100).toFixed(2)) : 0;
  const finalTotal = Math.max(0, Number((total - discount).toFixed(2)));

  const checkout = async () => {
    if (!user) return nav({ to: "/auth" });
    if (!address.trim()) return toast.error("Informe o endereço de entrega");
    setBusy(true);
    const { error } = await supabase.rpc("place_order", {
      _items: items.map(({ product_id, quantity }) => ({ product_id, quantity })),
      _address: address,
      _coupon: usable ? applied!.code : null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    clear();
    toast.success("Pedido realizado!");
    nav({ to: "/conta" });
  };

  if (!items.length) return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-extrabold">Seu carrinho está vazio</h1>
      <Button asChild className="mt-6"><Link to="/produtos">Continuar comprando</Link></Button>
    </div>
  );
  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <h1 className="text-2xl font-extrabold">Carrinho</h1>
        {items.map((i) => (
          <div key={i.product_id} className="flex items-center justify-between rounded-xl border bg-card p-4">
            <div><p className="font-medium">{i.name}</p><p className="text-sm text-muted-foreground">{brl(i.price)}</p></div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={() => setQty(i.product_id, i.quantity - 1)}><Minus className="h-4 w-4" /></Button>
              <span className="w-6 text-center">{i.quantity}</span>
              <Button size="icon" variant="outline" onClick={() => setQty(i.product_id, i.quantity + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
      <div className="h-fit space-y-3 rounded-xl border bg-card p-5 shadow-card">
        <p className="font-bold">Resumo</p>
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{brl(total)}</span></div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="cupom">Cupom de desconto</label>
          <div className="mt-1 flex gap-2">
            <Input id="cupom" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Ex.: BEMVINDO10" className="h-9 font-mono uppercase" />
          </div>
          {typed && !applied && <p className="mt-1 text-xs font-semibold text-sale">Cupom inválido ou expirado</p>}
          {applied && !usable && <p className="mt-1 text-xs font-semibold text-sale">Este cupom exige compra acima de {brl(min)}</p>}
          {usable && applied && <p className="mt-1 text-xs font-semibold text-primary">Cupom {applied.code} aplicado: -{applied.percent}%</p>}
          <Link to="/cupons" className="mt-1 inline-block text-xs font-semibold text-primary">Ver cupons disponíveis</Link>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-sm text-primary"><span>Desconto</span><span>-{brl(discount)}</span></div>
        )}
        <div className="flex justify-between text-lg"><span>Total</span><span className="font-extrabold text-primary-deep">{brl(finalTotal)}</span></div>
        <Textarea placeholder="Endereço de entrega" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Button className="w-full" size="lg" disabled={busy} onClick={checkout}>{user ? "Finalizar pedido" : "Entrar para finalizar"}</Button>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Ticket className="h-3 w-3" />O desconto é conferido no servidor ao finalizar.</p>
      </div>
    </div>
  );
}
