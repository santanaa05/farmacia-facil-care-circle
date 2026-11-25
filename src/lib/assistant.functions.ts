import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const input = z.object({ message: z.string().trim().min(1).max(2000), sessionId: z.string().max(100) });

async function callWebhook(url: string | undefined, body: Record<string, unknown>) {
  if (!url) return { ok: false as const, reply: "O webhook ainda não foi configurado." };
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) return { ok: false as const, reply: `O webhook respondeu com erro (${res.status}).` };
    const text = await res.text();
    let reply = text;
    try {
      const json = JSON.parse(text) as unknown;
      const obj = (Array.isArray(json) ? json[0] : json) as Record<string, unknown> | undefined;
      const v = obj && (obj["reply"] ?? obj["output"] ?? obj["message"] ?? obj["text"]);
      if (typeof v === "string") reply = v;
    } catch { /* texto puro */ }
    return { ok: true as const, reply: reply || "(sem resposta)" };
  } catch {
    return { ok: false as const, reply: "Não foi possível falar com o webhook agora." };
  }
}

// Chat do cliente (público: visitantes também podem perguntar)
export const askCustomerAssistant = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => input.parse(i))
  .handler(async ({ data }) =>
    callWebhook(process.env["CUSTOMER_WEBHOOK_URL"], { message: data.message, sessionId: data.sessionId, source: "farmaquaresma-cliente" }),
  );

// IA de análise de estoque do Admin (12 farmácias da rede)
export const askAdminAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => input.parse(i))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) return { ok: false as const, reply: "Acesso permitido apenas para administradores." };
    const [{ data: units }, { data: stock }] = await Promise.all([
      context.supabase.from("pharmacy_units").select("id, number, name, status").order("number"),
      context.supabase.from("unit_stock").select("unit_id, product_code, name, category, quantity, min_quantity, daily_sales, expiry_date").limit(5000),
    ]);
    return callWebhook(process.env["ADMIN_WEBHOOK_URL"], {
      message: data.message, sessionId: data.sessionId, userId: context.userId, source: "farmaquaresma-admin",
      units: units ?? [], stock: stock ?? [],
    });
  });
