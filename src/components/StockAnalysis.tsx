import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChatBox } from "@/components/ChatBox";
import { askAdminAssistant } from "@/lib/assistant.functions";

export function StockAnalysis() {
  const send = useServerFn(askAdminAssistant);
  const { data } = useQuery({
    queryKey: ["network-stock"],
    queryFn: async () => {
      const [{ data: units, error }, { data: stock, error: e2 }] = await Promise.all([
        supabase.from("pharmacy_units").select("id, number, name, status").order("number"),
        supabase.from("unit_stock").select("unit_id, quantity, min_quantity").limit(5000),
      ]);
      if (error) throw error;
      if (e2) throw e2;
      return (units ?? []).map((u) => {
        const items = (stock ?? []).filter((s) => s.unit_id === u.id);
        return { ...u, items: items.length, total: items.reduce((a, s) => a + s.quantity, 0), low: items.filter((s) => s.quantity <= s.min_quantity).length };
      });
    },
  });
  const units = data ?? [];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <div>
        <h2 className="text-xl font-bold">Estoque das {units.length || 12} farmácias da rede</h2>
        {!units.length && <p className="mt-4 rounded-2xl border bg-card p-8 text-center text-muted-foreground">Nenhuma unidade cadastrada ainda.</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {units.map((u) => (
            <div key={u.id} className="rounded-2xl border bg-card p-4 shadow-card">
              <p className="flex items-center gap-2 font-bold"><Store className="h-4 w-4 text-primary" />{u.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">Unidade {u.number} · {u.status}</p>
              <p className="mt-3 text-sm">{u.items} produtos · {u.total} unidades</p>
              {u.low > 0 && <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-destructive"><AlertTriangle className="h-4 w-4" />{u.low} abaixo do mínimo</p>}
            </div>
          ))}
        </div>
      </div>
      <ChatBox title="IA de análise de estoque" greeting="Olá! Tenho acesso ao estoque das 12 farmácias. Pergunte, por exemplo: quais produtos estão acabando?" send={send} />
    </div>
  );
}
