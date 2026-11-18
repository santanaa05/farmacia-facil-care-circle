import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { brl, useCart } from "@/lib/cart";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — FarmaQuarema" },
      { name: "description", content: "Revise seus produtos e finalize a compra." },
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
  const [busy, setBusy] = useState(false);

  const checkout = async () => {
    if (!user) return nav({ to: "/auth" });
    if (!address.trim()) return toast.error("Informe o endereço de entrega");
    setBusy(true);
    const { error } = await supabase.rpc("place_order", { _items: items.map(({ product_id, quantity }) => ({ product_id, quantity })), _address: address });
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
        <div className="flex justify-between text-lg"><span>Total</span><span className="font-extrabold text-primary-deep">{brl(total)}</span></div>
        <Textarea placeholder="Endereço de entrega" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Button className="w-full" size="lg" disabled={busy} onClick={checkout}>{user ? "Finalizar pedido" : "Entrar para finalizar"}</Button>
      </div>
    </div>
  );
}
